/**
 * Extract the CAPTCHA token from a Next.js request body.
 *
 * Tries FormData for multipart/form-data and application/x-www-form-urlencoded
 * requests; falls back to JSON for everything else (including bare application/json).
 * Returns null when the field is absent or empty — never throws on parse failure.
 *
 * @param request   The incoming Request (Next.js App Router or any Web API Request).
 * @param fieldName The body field that contains the token. Default: "token".
 */
export async function captchaTokenFromRequest(
  request: Request,
  fieldName = "token",
): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (
      contentType.includes("multipart/form-data") ||
      contentType.includes("application/x-www-form-urlencoded")
    ) {
      const form = await request.formData();
      const value = form.get(fieldName);
      return typeof value === "string" && value.length > 0 ? value : null;
    }

    // Covers application/json and requests with no content-type.
    const body = (await request.json()) as Record<string, unknown>;
    const value = body[fieldName];
    return typeof value === "string" && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * Extract the client IP address from common Next.js / CDN request headers.
 *
 * Checks the following headers in priority order:
 * 1. `CF-Connecting-IP` — set by Cloudflare
 * 2. `X-Forwarded-For` — set by load balancers and proxies (first address used)
 * 3. `X-Real-IP` — set by nginx
 *
 * Returns undefined when none of the headers are present.
 */
export function clientIpFromRequest(request: Request): string | undefined {
  const cf = request.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const real = request.headers.get("x-real-ip");
  if (real) return real;

  return undefined;
}
