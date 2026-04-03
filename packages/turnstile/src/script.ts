import { CaptchaError } from "captigo";

const SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Shared promise so all callers get the same in-flight load.
let loading: Promise<void> | null = null;

/**
 * Lazily inject the Turnstile browser script.
 *
 * Safe to call multiple times — the script is only inserted once and all
 * callers share the same promise. The in-flight promise is cleared on failure
 * so the next call can retry.
 */
export function loadScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new CaptchaError(
        "script-load-failed",
        "Turnstile can only be loaded in a browser environment.",
        "turnstile",
      ),
    );
  }

  // SDK is already present from a previous load or from a static script tag.
  if (window.turnstile) return Promise.resolve();

  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();

    script.onerror = () => {
      loading = null; // Allow retry on next call.
      reject(
        new CaptchaError(
          "script-load-failed",
          "Failed to load the Turnstile script. Check your network connection.",
          "turnstile",
        ),
      );
    };

    document.head.appendChild(script);
  });

  return loading;
}
