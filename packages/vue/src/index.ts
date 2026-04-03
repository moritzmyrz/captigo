export { Captcha } from "./captcha.js";
export type { CaptchaInstance } from "./captcha.js";

export { useCaptcha } from "./use-captcha.js";
export type { UseCaptchaOptions, UseCaptchaReturn } from "./use-captcha.js";

// Re-export core types for single-import convenience.
export { CaptchaError } from "@captigo/core";
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
} from "@captigo/core";
