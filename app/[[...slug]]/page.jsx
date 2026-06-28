const scripts = [
  "/shared/runtime.js",
  "/features/auth/login.js",
  "/features/dashboard/dashboard.js",
  "/features/playground/playground.js",
  "/features/api-keys/apiKeys.js",
  "/features/usage/usage.js",
  "/features/billing/billing.js",
  "/features/reports/reports.js",
  "/features/projects/projects.js",
  "/features/team/team.js",
  "/features/webhooks/webhooks.js",
  "/features/audit/audit.js",
  "/features/support/support.js",
  "/features/onboarding/onboarding.js",
  "/app.js",
];

export default function LegacyPortalPage() {
  return (
    <>
      <div id="legacy-portal-root" suppressHydrationWarning />
      {scripts.map((src, index) => (
        <script key={src} src={src} defer data-order={index} />
      ))}
    </>
  );
}
