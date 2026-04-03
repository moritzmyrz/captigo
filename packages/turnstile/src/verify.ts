import { CaptchaError } from "captigo";
import type { VerifyOptions, VerifyResult } from "captigo";
import { VerifyRequestError, postVerify } from "@captigo/shared";
import type { ProviderVerifyResponse } from "@captigo/shared";

// ─── Response shape ───────────────────────────────────────────────────────────

interface TurnstileVerifyResponse extends ProviderVerifyResponse {
  action?: string;
  cdata?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// ─── Verify ───────────────────────────────────────────────────────────────────

/**
 * Verify a Turnstile token against Cloudflare's siteverify API.
 *
 * Must only be called from a **server** environment.
 * Never include your `secretKey` in browser code.
 *
 * Returns a `VerifyResult` for both success and failure — only throws on
 * network errors or non-OK HTTP responses.
 *
 * @example
 * ```ts
 * const result = await verifyToken(token, process.env.TURNSTILE_SECRET!);
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
    const data = await postVerify<TurnstileVerifyResponse>(VERIFY_URL, fields);

    return {
      success: data.success,
      provider: "turnstile",
      challengeTs: data["challenge_ts"],
      hostname: data.hostname,
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    if (err instanceof CaptchaError) throw err;

    if (err instanceof VerifyRequestError) {
      throw new CaptchaError(
        "verify-failed",
        `Turnstile verification request failed with HTTP ${err.status}.`,
        "turnstile",
      );
    }

    throw new CaptchaError(
      "verify-failed",
      `Turnstile verification failed: ${err instanceof Error ? err.message : String(err)}`,
      "turnstile",
    );
  }
}
