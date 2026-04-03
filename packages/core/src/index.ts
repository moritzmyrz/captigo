// Types
export type {
  AdapterConfig,
  AdapterMeta,
  CaptchaMode,
  CaptchaToken,
  ProviderId,
  VerifyOptions,
  VerifyResult,
} from "./types.js";

// Adapter contracts
export type {
  AdapterFactory,
  CaptchaAdapter,
  CaptchaWidget,
  RenderOptions,
  WidgetCallbacks,
} from "./adapter.js";

// Errors
export { CaptchaError } from "./errors.js";
export type { CaptchaErrorCode } from "./errors.js";
