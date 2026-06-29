# Platform Portal Kong Runtime Implementation

This document converts `pepiko-kong-runtime-portal-implementation.md` into a practical implementation plan for the customer-facing Platform Portal in this repo.

The Platform Portal must never call Kong Admin API directly. Browser code calls only `platform-core-service` endpoints under `/api/customer/*`. The core service owns all Kong Admin API calls, database writes, auditing, and drift handling.

## Current Portal Mapping

| Existing Platform Portal Feature | Current Files | Kong Runtime Mapping | Required Change |
|---|---|---|---|
| API Keys | `src/features/api-keys/apiKeys.js`, `/api/customer/api-keys` | Kong `key-auth` credential on tenant Consumer | Create, rotate, revoke, and delete must call core service; core service must sync Kong credential state. |
| API Playground | `src/features/playground/playground.js`, `/api/customer/products`, `/api/customer/runtime/playground/request` | Published API products backed by Kong public runtime routes | Use published products from core service. Playground submissions go through `platform-core-service`, which calls the configured runtime endpoint server-side. |
| Dashboard | `src/features/dashboard/dashboard.js`, `/api/customer/dashboard` | Tenant runtime health summary | Add sync status, active runtime keys, quota status, and latest runtime warning from core service. |
| Usage | `src/features/usage/usage.js`, `/api/customer/usage` | Runtime usage from Kong logs/metrics after ingestion | Core service returns normalized usage. Portal displays it only. |
| Billing / Plan | `src/features/billing/billing.js`, `/api/customer/billing`, `/api/customer/plans` | Plan limits enforced by Kong rate-limiting plugin | Display plan and usage limit state. No customer-side Kong edits. |
| Projects | `src/features/projects/projects.js` | Project metadata only | Projects may scope API keys in Pepiko DB, but Kong Consumer remains organization-level. |
| Team | `src/features/team/team.js` | Portal authorization only | Team users are not Kong Consumers. Do not create Kong Consumers per email/user. |
| Audit | `src/features/audit/audit.js` | Customer-visible runtime audit | Include key created, rotated, revoked, deleted, and suspension-related events. |
| Support | `src/features/support/support.js` | Runtime support workflow | Customers open tickets for quota/access issues. No direct runtime mutation. |

## Runtime Identity Model

Kong Consumer maps to the customer organization only.

```text
Organization.id   -> Kong Consumer custom_id
Organization.slug -> Kong Consumer username tenant_<slug>
ApiKey row        -> Kong key-auth credential under that Consumer
CustomerUser      -> Portal user only, never a Kong Consumer
```

Example:

```text
Organization: BrightMinds Inc.
Slug: brightminds-inc
Kong Consumer username: tenant_brightminds-inc
Kong Consumer custom_id: organizations.id
```

All API keys created by users in the same customer organization belong to the same Kong Consumer. Key ownership remains in Pepiko DB through `ApiKey.owner_user_id`.

## Required Backend Contract

The Platform Portal should call these customer endpoints only:

```http
GET    /api/customer/runtime/status
GET    /api/customer/runtime/access
GET    /api/customer/runtime/audit

GET    /api/customer/api-keys
GET    /api/customer/api-keys/capacity
POST   /api/customer/api-keys
POST   /api/customer/api-keys/{api_key_id}/rotate
POST   /api/customer/api-keys/{api_key_id}/revoke
DELETE /api/customer/api-keys/{api_key_id}

GET    /api/customer/products
GET    /api/customer/usage
GET    /api/customer/billing
GET    /api/customer/dashboard
```

The frontend must not contain:

```text
/consumers
/key-auth
/plugins
/routes
/services
KONG_ADMIN_URL
KONG_ADMIN_TOKEN
```

## API Key Lifecycle

### Create Key

Existing UI: `src/features/api-keys/apiKeys.js`

Portal behavior:

1. User submits name, project, environment, optional restrictions.
2. Portal calls `POST /api/customer/api-keys`.
3. Core service checks organization status and API key limit.
4. Core service ensures a Kong Consumer exists for the organization.
5. Core service generates the raw key once.
6. Core service stores only hash, prefix, masked key, metadata, and Kong credential id.
7. Core service creates Kong `key-auth` credential for `tenant_<organization.slug>`.
8. Portal shows the raw key once in the success modal.

Recommended response shape:

```json
{
  "id": 12,
  "name": "Production key",
  "key_prefix": "pko_live",
  "masked_key": "pko_live_****abcd",
  "environment": "production",
  "status": "active",
  "kong_sync_status": "synced",
  "api_key": "pko_live_actual_secret_visible_once"
}
```

### Revoke Key

Existing UI already has revoke/delete actions. The portal action must call core service only.

Required core behavior:

1. Verify key belongs to the logged-in user's organization.
2. Delete the matching Kong credential using stored `kong_credential_id`.
3. Mark DB key `status = revoked`.
4. Keep the row for history and audit.
5. Return updated key.

Acceptance rule:

```text
After revoke, the public API gateway must reject the key with 401.
```

### Delete Key

Delete from the portal means "remove from customer view", but runtime safety comes first.

Required core behavior:

1. If the key is active, revoke/delete Kong credential first.
2. Mark DB key as revoked or deleted based on retention policy.
3. Write audit log.

Do not delete the Kong Consumer when deleting one key.

### Rotate Key

Required core behavior:

1. Generate a new raw key.
2. Create new Kong credential first.
3. Store new hash/prefix/masked value in Pepiko DB.
4. Delete old Kong credential.
5. Mark old credential metadata as rotated/revoked if history is modeled separately.
6. Return new raw key once.

For the current single-row `ApiKey` model, update the same row and keep an audit entry containing old masked value, not the old raw key.

## Active Key Count Sync

Current business rule: default active API key limit is 2, configurable by Internal Portal up to 5.

Customer-visible behavior:

```text
If active/non-revoked key count >= configured limit:
  Disable Create API Key button.
  Show a clear warning message from the existing message system.
```

Runtime sync rule:

```text
Active key count = Pepiko DB keys with runtime-usable status and valid Kong credential.
```

If a customer revokes a key:

1. Core service removes its Kong credential.
2. DB status becomes `revoked`.
3. It no longer counts against active key capacity.
4. Public gateway must reject that key.

If Kong credential deletion fails:

1. Core service must not report success as complete.
2. Mark `kong_sync_status = drifted` or `revoke_pending`.
3. Return a meaningful warning to the portal.
4. Internal Portal drift screen handles repair.

## Product Access And Playground

Existing UI:

```text
src/features/playground/playground.js
src/features/dashboard/dashboard.js
GET /api/customer/products
```

Product source:

```text
ProductConfig.status = published
ProductConfig.endpoint_path = absolute public/runtime endpoint
ProductConfig.config_json.request_body_template = optional JSON body
ProductConfig.config_json.authentication_type = key_auth | bearer | none
```

Platform Portal should show published products under API Playground navigation. On click:

1. Load the selected product from `/api/customer/products`.
2. Render a product-specific playground page.
3. Let the customer edit only JSON/text request body fields.
4. Send the playground submission to `/api/customer/runtime/playground/request`.
5. Core service looks up `ProductConfig.endpoint_path` and calls the runtime endpoint server-side.
6. Include customer-provided API key as `x-api-key` from core service when the product requires key auth.
6. Display real response on the right.

Important:

```text
API Playground calls platform-core-service only.
API Playground never calls Kong Admin API.
Platform Portal remains a customer portal; platform-core-service is the only server-side component allowed to call Kong/runtime endpoints.
```

## Suspended Customer Handling

Existing login and protected action behavior should remain, with runtime enforcement added.

When organization status is not `active`:

1. Login should return a clear suspended account message.
2. If login is allowed for viewing, every mutating customer endpoint must return 403.
3. Core service must revoke or disable all Kong credentials for that organization.
4. Platform Portal shows a top information/warning banner.

Required runtime result:

```text
Suspended customer API keys must not work against public APIs.
```

Do not rely only on portal blocking. Kong runtime credentials must be removed or disabled by the core service.

## Runtime Status Page

Add or extend a customer-facing status view using `/api/customer/runtime/status`.

Suggested response:

```json
{
  "organization_status": "active",
  "kong_consumer": {
    "username": "tenant_brightminds-inc",
    "sync_status": "synced",
    "last_synced_at": "2026-06-28T10:00:00Z"
  },
  "api_keys": {
    "active_in_db": 2,
    "active_in_kong": 2,
    "drift": false
  },
  "access": {
    "sync_status": "synced",
    "enabled_products": ["classify", "validate"]
  },
  "limits": {
    "plan_code": "growth",
    "sync_status": "synced"
  }
}
```

Portal display:

- Account runtime status
- Active runtime key count
- API access sync status
- Latest warning if drift exists
- Last successful sync time

## Frontend Implementation Tasks

1. Keep all Kong-aware calls in a `runtime` feature module or existing feature files calling `/api/customer/*`.
2. Add runtime fields to API key list rows:
   - `kong_sync_status`
   - `last_used_at`
   - `environment`
   - `status`
3. Disable key creation when `/api/customer/api-keys/capacity.can_create` is false.
4. Show meaningful success/error/warning/info messages:
   - "Production API key created. Copy it now; it will not be shown again."
   - "API key revoked and removed from runtime gateway."
   - "API key was revoked in Pepiko, but Kong sync is pending. Runtime Operations has been notified."
5. Add runtime status section to Dashboard or a dedicated Runtime Status route.
6. Keep Team and Projects free of Kong Consumer creation logic.

## Core Service Responsibilities

The Platform Portal depends on core service to implement:

```text
app/services/kong_admin_service.py
app/services/runtime_sync_service.py
app/services/runtime_audit_service.py
```

Suggested Python methods:

```python
class KongAdminService:
    def health_check(self, environment: str) -> bool: ...
    def ensure_consumer(self, org: Organization) -> dict: ...
    def create_key_credential(self, org: Organization, raw_key: str) -> dict: ...
    def delete_key_credential(self, org: Organization, credential_id: str) -> None: ...
    def list_key_credentials(self, org: Organization) -> list[dict]: ...
    def sync_acl_groups(self, org: Organization, groups: list[str]) -> None: ...
    def sync_rate_limit(self, org: Organization, limits: dict) -> None: ...
```

The frontend should treat these as opaque backend operations.

## Acceptance Checklist

- Platform Portal has no Kong Admin API URL or token.
- Customer API keys are created only through `/api/customer/api-keys`.
- Full raw key is shown only once after create/rotate.
- Revoked or deleted customer key cannot call the public API.
- Customer organization maps to one Kong Consumer.
- Individual team users do not create Kong Consumers.
- Suspended customer cannot use existing API keys.
- Published products appear in API Playground navigation.
- API Playground sends runtime calls to configured absolute endpoint only.
- Runtime status shows DB/Kong sync state from core service.
