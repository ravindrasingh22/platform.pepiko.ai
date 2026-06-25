# Platform Frontend Architecture

This portal uses a feature-based colocated structure.

```text
app.js                 Bootstrap only
shared/runtime.js      Shared state, API helper, shell, router, formatting helpers
features/
  auth/                Login UI
  onboarding/          Account registration and guided setup flow
  dashboard/           Overview page
  api-keys/            API key list/forms/actions
  playground/          Public API playground
  projects/            Projects/apps management
  billing/             Wallet, invoices, payment methods, auto-recharge
  usage/               Usage summary and events
  reports/             Risk and billing reports
  team/                Customer team management
  webhooks/            Webhook endpoints and test delivery
  audit/               Customer audit log
  support/             Customer support tickets
```

Keep new page logic inside the matching `features/<feature>/` folder. Shared helpers belong in `shared/runtime.js` only when multiple features use them.
