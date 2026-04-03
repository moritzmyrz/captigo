// ─── v2 ───────────────────────────────────────────────────────────────────────
export { recaptchaV2 } from "./adapter-v2.js";
export type { ReCaptchaV2Config } from "./config.js";
export { verifyV2Token } from "./verify.js";

// ─── v3 ───────────────────────────────────────────────────────────────────────
export { recaptchaV3 } from "./adapter-v3.js";
export type { ReCaptchaV3Config } from "./config.js";
export { verifyV3Token } from "./verify.js";
export type { ReCaptchaV3VerifyResult } from "./verify.js";

// ─── Script preloaders ────────────────────────────────────────────────────────
export { loadV2Script as preloadV2Script, loadV3Script as preloadV3Script } from "./script.js";

// ─── Core re-exports ──────────────────────────────────────────────────────────
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
