// Adapter factory — the main entry point.
export { turnstile } from "./adapter.js";

// Config type — consumers need this to pass options to the factory.
export type { TurnstileConfig } from "./config.js";

// Re-export the verify function for server-side usage without creating
// a full adapter. Useful in edge runtimes where you only need verification.
export { verifyToken } from "./verify.js";

// Re-export common core types so consumers can use a single import.
export { CaptchaError } from "@captigo/core";
export type {
  CaptchaAdapter,
  CaptchaErrorCode,
  CaptchaMode,
  CaptchaToken,
  CaptchaWidget,
  VerifyOptions,
  VerifyResult,
  WidgetCallbacks,
} from "@captigo/core";

// Script preloader — call early to start loading the SDK before widgets mount.
export { loadScript as preloadScript } from "./script.js";
