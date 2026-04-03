import { CaptchaError } from "@captigo/core";

const SCRIPT_URL = "https://js.hcaptcha.com/1/api.js?render=explicit";

let loading: Promise<void> | null = null;

/**
 * Lazily inject the hCaptcha browser script.
 * Safe to call multiple times — only one script tag is ever added.
 */
export function loadScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new CaptchaError(
        "script-load-failed",
        "hCaptcha can only be loaded in a browser environment.",
        "hcaptcha",
      ),
    );
  }

  if (window.hcaptcha) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(
        new CaptchaError(
          "script-load-failed",
          "Failed to load the hCaptcha script. Check your network connection.",
          "hcaptcha",
        ),
      );
    };

    document.head.appendChild(script);
  });

  return loading;
}
