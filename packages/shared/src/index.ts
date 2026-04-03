// Shared internal utilities for captigo packages.
// Nothing here is part of the public API.

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

/** Minimal shape of a provider verification API response. */
export interface ProviderVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Thrown by `postVerify` when the HTTP response has a non-OK status.
 * Provider packages catch this and re-throw as `CaptchaError("verify-failed")`.
 */
export class VerifyRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Verification request failed with HTTP ${status}`);
    this.name = "VerifyRequestError";
    this.status = status;
  }
}

/**
 * POST to a provider's siteverify endpoint with the given form fields.
 * Returns the parsed JSON response, or throws `VerifyRequestError` on non-OK
 * HTTP responses.
 */
export async function postVerify<T extends ProviderVerifyResponse>(
  url: string,
  fields: Record<string, string>,
): Promise<T> {
  const body = new URLSearchParams(fields);
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new VerifyRequestError(response.status);
  }

  return response.json() as Promise<T>;
}
