// ─── React API ────────────────────────────────────────────────────────────────

export { Captcha } from "./captcha.js";
export type { CaptchaHandle, CaptchaProps } from "./captcha.js";

export { useCaptcha } from "./use-captcha.js";
export type { UseCaptchaOptions, UseCaptchaReturn } from "./use-captcha.js";

// ─── Core re-exports ──────────────────────────────────────────────────────────
// Consumers should be able to work with a single import from @captigo/react.

export { CaptchaError } from "captigo";
export type {
  AdapterConfig,
  AdapterMeta,
  CaptchaAdapter,
  CaptchaErrorCode,
  CaptchaMode,
  CaptchaToken,
  // CaptchaWidget (the core interface) is intentionally not re-exported here
  // to avoid a naming conflict with Captcha component. Import it directly
  // from "captigo" if you need the widget handle type.
  VerifyOptions,
  VerifyResult,
  WidgetCallbacks,
} from "captigo";
