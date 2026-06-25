# platform-frontend

Customer-facing frontend for `platform.pepiko.ai`.

Features:

- Overview dashboard
- API playground
- API keys
- Projects/apps
- Usage
- Billing/credits/payment methods/auto-recharge/invoices
- Reports
- Team management
- Webhooks
- Audit logs
- Support tickets

The app calls `/api/customer/*` and `/api/public/v1/*`. In Docker, nginx proxies those paths to `platform-core-service`.

Frontend code is organized by feature under `src/features/*`; see `src/ARCHITECTURE.md`.
