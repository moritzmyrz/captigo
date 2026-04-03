import { CaptchaError } from "@captigo/core";

// v2 always uses explicit render so we control when widgets are created.
const V2_SCRIPT_URL = "https://www.google.com/recaptcha/api.js?render=explicit";

// v3 embeds the site key in the URL — one URL per site key.
const v3ScriptURL = (siteKey: string) =>
  `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;

let v2Loading: Promise<void> | null = null;
// Map from siteKey → in-flight load promise
const v3Loading = new Map<string, Promise<void>>();

function injectScript(src: string, providerId: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      reject(
        new CaptchaError(
          "script-load-failed",
          "Failed to load the reCAPTCHA script. Check your network connection.",
          providerId,
        ),
      );
    };
    document.head.appendChild(script);
  });
}

/** Lazily load the reCAPTCHA v2 browser script. */
export function loadV2Script(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new CaptchaError(
        "script-load-failed",
        "reCAPTCHA can only run in a browser.",
        "recaptcha-v2",
      ),
    );
  }

  if (window.grecaptcha) return Promise.resolve();
  if (v2Loading) return v2Loading;

  v2Loading = injectScript(V2_SCRIPT_URL, "recaptcha-v2").catch((err) => {
    v2Loading = null;
    throw err;
  });
  return v2Loading;
}

/** Lazily load the reCAPTCHA v3 browser script for the given site key. */
export function loadV3Script(siteKey: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new CaptchaError(
        "script-load-failed",
        "reCAPTCHA can only run in a browser.",
        "recaptcha-v3",
      ),
    );
  }

  if (window.grecaptcha) return Promise.resolve();

  const cached = v3Loading.get(siteKey);
  if (cached) return cached;

  const promise = injectScript(v3ScriptURL(siteKey), "recaptcha-v3").catch((err) => {
    v3Loading.delete(siteKey);
    throw err;
  });

  v3Loading.set(siteKey, promise);
  return promise;
}

/**
 * Wait for grecaptcha to be fully initialized.
 * Must be called after the script has loaded. `grecaptcha.ready()` fires
 * immediately if the SDK is already initialized, otherwise queues the callback.
 */
export function whenReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    window.grecaptcha!.ready(resolve);
  });
}
