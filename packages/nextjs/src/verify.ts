import { CaptchaError } from "@captigo/core";
import type { CaptchaAdapter, VerifyResult } from "@captigo/core";
import { captchaTokenFromRequest, clientIpFromRequest } from "./request.js";

export interface VerifyCaptchaRequestOptions {
  /** Request body field that holds the CAPTCHA token. Default: "token". */
  fieldName?: string;
  /**
   * Forward the client IP to the provider as an additional fraud signal.
   * Resolves from CF-Connecting-IP, X-Forwarded-For, or X-Real-IP headers.
   * Default: true.
   */
  forwardIp?: boolean;
}

/**
 * Verify a CAPTCHA token directly from a Next.js request body.
 *
 * Extracts the token, resolves the client IP, and delegates to
 * `adapter.verify()`. Does not throw on a failed challenge — check
 * `result.success` for that. Throws `CaptchaError` when the token is absent
 * from the request or when the provider network call fails.
 *
 * @example
 * ```ts
 * // app/api/submit/route.ts
 * import { verifyCaptchaFromRequest, CaptchaError } from "@captigo/nextjs";
 * import { turnstile } from "@captigo/turnstile";
 *
 * const adapter = turnstile({ siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! });
 *
 * export async function POST(request: Request) {
 *   const result = await verifyCaptchaFromRequest(
 *     request,
 *     adapter,
 *     process.env.TURNSTILE_SECRET!,
 *   );
 *   if (!result.success) {
 *     return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
 *   }
 *   // ... handle the verified request
 * }
 * ```
 */
export async function verifyCaptchaFromRequest(
  request: Request,
  adapter: CaptchaAdapter,
  secretKey: string,
  options: VerifyCaptchaRequestOptions = {},
): Promise<VerifyResult> {
  const { fieldName = "token", forwardIp = true } = options;

  const token = await captchaTokenFromRequest(request, fieldName);
  if (!token) {
    throw new CaptchaError(
      "execute-failed",
      `CAPTCHA token not found in request body. Expected field: "${fieldName}".`,
      adapter.meta.id,
    );
  }

  const remoteip = forwardIp ? clientIpFromRequest(request) : undefined;
  return adapter.verify(token, secretKey, remoteip !== undefined ? { remoteip } : undefined);
}
