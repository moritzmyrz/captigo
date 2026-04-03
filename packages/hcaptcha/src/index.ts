export { hcaptcha } from "./adapter.js";
export type { HCaptchaConfig } from "./config.js";
export { verifyToken } from "./verify.js";
export { loadScript as preloadScript } from "./script.js";

export { CaptchaError } from "captigo";
export type {
  CaptchaAdapter,
  CaptchaErrorCode,
  CaptchaMode,
  CaptchaToken,
  CaptchaWidget,
  VerifyOptions,
  VerifyResult,
  WidgetCallbacks,
} from "captigo";
