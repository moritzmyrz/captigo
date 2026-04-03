import { CaptchaError } from "captigo";
import type { VerifyOptions, VerifyResult } from "captigo";
import { VerifyRequestError, postVerify } from "@captigo/shared";
import type { ProviderVerifyResponse } from "@captigo/shared";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// ─── Response shapes ──────────────────────────────────────────────────────────

interface ReCaptchaVerifyResponse extends ProviderVerifyResponse {
  score?: number;
  action?: string;
}

// ─── Shared request helper ────────────────────────────────────────────────────

async function request(
  token: string,
  secretKey: string,
  provider: "recaptcha-v2" | "recaptcha-v3",
  options?: VerifyOptions,
): Promise<ReCaptchaVerifyResponse> {
  const fields: Record<string, string> = {
    secret: secretKey,
    response: token,
  };

  if (options?.remoteip !== undefined) {
    fields["remoteip"] = options.remoteip;
  }

  try {
    return await postVerify<ReCaptchaVerifyResponse>(VERIFY_URL, fields);
  } catch (err) {
    if (err instanceof CaptchaError) throw err;
    if (err instanceof VerifyRequestError) {
      throw new CaptchaError(
        "verify-failed",
        `reCAPTCHA verification request failed with HTTP ${err.status}.`,
        provider,
      );
    }
    throw new CaptchaError(
      "verify-failed",
      `reCAPTCHA verification failed: ${err instanceof Error ? err.message : String(err)}`,
      provider,
    );
  }
}

// ─── v2 ───────────────────────────────────────────────────────────────────────

/**
 * Verify a reCAPTCHA v2 token server-side.
 *
 * Must only be called from a **server** environment.
 */
export async function verifyV2Token(
  token: string,
  secretKey: string,
  options?: VerifyOptions,
): Promise<VerifyResult> {
  const data = await request(token, secretKey, "recaptcha-v2", options);

  const result: VerifyResult = { success: data.success, provider: "recaptcha-v2" };
  if (data["challenge_ts"] !== undefined) result.challengeTs = data["challenge_ts"];
  if (data.hostname !== undefined) result.hostname = data.hostname;
  if (data["error-codes"] !== undefined) result.errorCodes = data["error-codes"];
  return result;
}

// ─── v3 ───────────────────────────────────────────────────────────────────────

/**
 * The v3 verify result includes `score` (0.0 – 1.0) and the `action` name
 * returned by Google. Use `action` to verify it matches what you expected.
 */
export interface ReCaptchaV3VerifyResult extends VerifyResult {
  /** Score from 0.0 (very likely a bot) to 1.0 (very likely a human). */
  score?: number;
  /**
   * The action name Google recorded for this token.
   * Cross-check with the action you passed to `widget.execute()`.
   */
  action?: string;
}

/**
 * Verify a reCAPTCHA v3 token server-side.
 *
 * Always check `result.score`. Google recommends rejecting scores below `0.5`
 * for most use cases, but you may tune this threshold for your application.
 *
 * Must only be called from a **server** environment.
 */
export async function verifyV3Token(
  token: string,
  secretKey: string,
  options?: VerifyOptions,
): Promise<ReCaptchaV3VerifyResult> {
  const data = await request(token, secretKey, "recaptcha-v3", options);

  const result: ReCaptchaV3VerifyResult = {
    success: data.success,
    provider: "recaptcha-v3",
  };
  if (data["challenge_ts"] !== undefined) result.challengeTs = data["challenge_ts"];
  if (data.hostname !== undefined) result.hostname = data.hostname;
  if (data["error-codes"] !== undefined) result.errorCodes = data["error-codes"];
  if (data.score !== undefined) result.score = data.score;
  if (data.action !== undefined) result.action = data.action;
  return result;
}
