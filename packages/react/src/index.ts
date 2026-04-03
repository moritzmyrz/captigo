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
  CaptchaWidget,
  VerifyOptions,
  VerifyResult,
  WidgetCallbacks,
} from "captigo";
