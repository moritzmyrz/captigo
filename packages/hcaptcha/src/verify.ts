import { CaptchaError } from "captigo";
import type { VerifyOptions, VerifyResult } from "captigo";
import { VerifyRequestError, postVerify } from "@captigo/shared";
import type { ProviderVerifyResponse } from "@captigo/shared";

interface HCaptchaVerifyResponse extends ProviderVerifyResponse {
  credit?: boolean;
  score?: number;
  score_reason?: string[];
}

const VERIFY_URL = "https://api.hcaptcha.com/siteverify";

/**
 * Verify an hCaptcha token against the hCaptcha siteverify API.
 *
 * Must only be called from a **server** environment.
 * Never expose your secret key to the browser.
 *
 * Returns a `VerifyResult` for both success and failure — only throws on
 * network errors or non-OK HTTP responses.
 *
 * @example
 * ```ts
 * const result = await verifyToken(token, process.env.HCAPTCHA_SECRET!);
 * if (!result.success) {
 *   return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
 * }
 * ```
 */
export async function verifyToken(
  token: string,
  secretKey: string,
  options?: VerifyOptions,
): Promise<VerifyResult> {
  const fields: Record<string, string> = {
    secret: secretKey,
    response: token,
  };

  if (options?.remoteip !== undefined) {
    fields["remoteip"] = options.remoteip;
  }

  try {
    const data = await postVerify<HCaptchaVerifyResponse>(VERIFY_URL, fields);

    const result: VerifyResult = { success: data.success, provider: "hcaptcha" };
    if (data["challenge_ts"] !== undefined) result.challengeTs = data["challenge_ts"];
    if (data.hostname !== undefined) result.hostname = data.hostname;
    if (data["error-codes"] !== undefined) result.errorCodes = data["error-codes"];
    if (data.score !== undefined) result.score = data.score;
    return result;
  } catch (err) {
    if (err instanceof CaptchaError) throw err;

    if (err instanceof VerifyRequestError) {
      throw new CaptchaError(
        "verify-failed",
        `hCaptcha verification request failed with HTTP ${err.status}.`,
        "hcaptcha",
      );
    }

    throw new CaptchaError(
      "verify-failed",
      `hCaptcha verification failed: ${err instanceof Error ? err.message : String(err)}`,
      "hcaptcha",
    );
  }
}
