/**
 * All errors thrown by captigo and its provider packages are instances
 * of CaptchaError. Check `error.code` to branch on specific failure cases
 * without string-matching the message.
 */
export type CaptchaErrorCode =
  | "script-load-failed" // provider script could not be loaded or timed out
  | "render-failed" // widget failed to mount into the container
  | "execute-failed" // challenge could not be triggered (e.g. called before ready)
  | "verify-failed" // server-side HTTP request to the provider API failed
  | "token-expired" // a token was present but the provider reported it as expired
  | "provider-error" // provider returned success:false with error codes
  | "not-implemented"; // adapter method has not been implemented yet

/** V8-only (Node.js / Chrome). Not on `ErrorConstructor` in DOM/ES libs. */
type ErrorConstructorWithCapture = ErrorConstructor & {
  captureStackTrace?: (
    target: object,
    constructorOpt?: new (...args: unknown[]) => unknown,
  ) => void;
};

export class CaptchaError extends Error {
  readonly code: CaptchaErrorCode;
  /** The provider that raised this error, if known (e.g. "turnstile"). */
  readonly provider: string | undefined;

  constructor(code: CaptchaErrorCode, message: string, provider?: string) {
    super(message);
    this.name = "CaptchaError";
    this.code = code;
    this.provider = provider;

    // Preserves a clean stack trace in V8 (Node.js / Chrome).
    const Err = Error as ErrorConstructorWithCapture;
    if (typeof Err.captureStackTrace === "function") {
      Err.captureStackTrace(this, CaptchaError);
    }
  }
}
