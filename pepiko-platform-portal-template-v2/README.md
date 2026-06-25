# Pepiko Customer Portal Template

Static HTML/CSS template for `platform.pepiko.ai` using the same pepiko.ai blue/navy visual system.

## Included pages

- `login.html`
- `overview.html`
- `api-playground.html`
- `api-keys.html`
- `usage.html`
- `billing.html`
- `reports.html`
- `team-members.html`
- `projects-apps.html`
- `webhooks.html`
- `audit-logs.html`
- `account-settings.html`
- `help-support.html`

## Folders

- `css/styles.css`
- `assets/img/`
- `assets/reference/` — includes the supplied all-pages reference image when available.

## Run locally

```bash
python3 -m http.server 8080
```

Then open:

```txt
http://localhost:8080
```

## Notes

This is a static front-end template. Authentication, API calls, billing provider, charts, table filters, account permissions, and backend actions need implementation.


## Added onboarding pages

- `registration.html`
- `verify-email.html`
- `onboarding-organization.html`
- `onboarding-product.html`
- `onboarding-api-key.html`
- `onboarding-team.html`
- `onboarding-complete.html`

These pages use the same pepiko.ai blue/navy design system and are designed to connect naturally into the customer portal.
