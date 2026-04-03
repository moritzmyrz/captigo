import type { CaptchaAdapter } from "@captigo/core";
import { hcaptcha } from "@captigo/hcaptcha";
import { turnstile } from "@captigo/turnstile";

export type CaptchaProvider = "turnstile" | "hcaptcha";

/**
 * Single place that picks the provider. In a real app this might read env at build
 * time (different bundles) or a remote config flag — the UI stays the same because
 * everything implements CaptchaAdapter.
 */
export function createCaptchaAdapter(which: CaptchaProvider): CaptchaAdapter {
  if (which === "hcaptcha") {
    return hcaptcha({
      siteKey: import.meta.env.VITE_HCAPTCHA_SITE_KEY ?? "10000000-ffff-ffff-ffff-000000000001",
      theme: "light",
    });
  }

  return turnstile({
    siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
    theme: "auto",
  });
}
