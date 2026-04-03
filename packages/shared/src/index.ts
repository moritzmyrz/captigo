// Shared internal utilities for captigo packages.
// Nothing here is part of the public API.

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

/** Minimal shape of a provider verification API response. */
export interface ProviderVerifyResponse {
  success: boolean;
  "challenge_ts"?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * POST to a provider's siteverify endpoint with the given form fields.
 * Returns the parsed JSON response.
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
    throw new Error(`captigo: verification request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// ─── Type utilities ───────────────────────────────────────────────────────────

/** Make all properties of T optional except for those in K. */
export type RequireOnly<T, K extends keyof T> = Partial<T> & Pick<T, K>;
