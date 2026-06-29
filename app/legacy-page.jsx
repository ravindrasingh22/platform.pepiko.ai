"use client";

import { useEffect } from "react";

const scripts = [
  "/shared/runtime.js",
  "/features/dashboard/dashboard.js",
  "/features/api-keys/apiKeys.js",
  "/features/playground/playground.js",
  "/features/runtime/runtime.js",
  "/features/usage/usage.js",
  "/features/billing/billing.js",
  "/features/reports/reports.js",
  "/features/team/team.js",
  "/features/webhooks/webhooks.js",
  "/features/audit/audit.js",
  "/features/support/support.js",
  "/features/account/account.js",
  "/features/onboarding/onboarding.js",
  "/features/auth/login.js",
  "/app.js",
];

export default function LegacyPortalPage() {
  useEffect(() => {
    function preloadScript(src) {
      if (document.querySelector(`link[data-legacy-preload="${src}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "script";
      link.href = src;
      link.dataset.legacyPreload = src;
      document.head.appendChild(link);
    }

    function loadScript(src, index) {
      const existing = document.querySelector(`script[data-legacy-src="${src}"]`);
      if (existing?.dataset.loaded === "true") return Promise.resolve();
      window.__pepikoScriptPromises = window.__pepikoScriptPromises || {};
      if (window.__pepikoScriptPromises[src]) return window.__pepikoScriptPromises[src];

      window.__pepikoScriptPromises[src] = new Promise((resolve, reject) => {
        if (existing) {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = false;
        script.dataset.legacySrc = src;
        script.dataset.order = String(index);
        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.body.appendChild(script);
      });
      return window.__pepikoScriptPromises[src];
    }

    async function loadPortal() {
      if (window.__pepikoPortalLoaded) return;
      if (window.__pepikoPortalLoading) {
        await window.__pepikoPortalLoading;
        return;
      }
      scripts.forEach(preloadScript);
      window.__pepikoPortalLoading = (async () => {
        for (let index = 0; index < scripts.length; index += 1) {
          await loadScript(scripts[index], index);
        }
        window.__pepikoPortalLoaded = true;
      })();
      try {
        await window.__pepikoPortalLoading;
      } catch (error) {
        window.__pepikoPortalLoading = null;
        throw error;
      }
    }

    loadPortal().catch((error) => {
      console.error(error);
    });

    return () => {};
  }, []);

  return <div id="legacy-portal-root" suppressHydrationWarning />;
}
