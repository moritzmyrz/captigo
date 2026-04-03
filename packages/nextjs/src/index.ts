export { captchaTokenFromRequest, clientIpFromRequest } from "./request.js";
export { verifyCaptchaFromRequest } from "./verify.js";
export type { VerifyCaptchaRequestOptions } from "./verify.js";

// Core re-exports so consumers can work with a single @captigo/nextjs import.
export { CaptchaError } from "@captigo/core";
export type { CaptchaAdapter, CaptchaErrorCode, VerifyOptions, VerifyResult } from "@captigo/core";
