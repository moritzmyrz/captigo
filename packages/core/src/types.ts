// ─── Provider identification ──────────────────────────────────────────────────

/**
 * Well-known provider identifiers. The `(string & {})` intersection keeps the
 * type open for custom adapters while preserving autocomplete for the built-ins.
 */
export type ProviderId = "turnstile" | "hcaptcha" | "recaptcha-v2" | "recaptcha-v3" | (string & {});

// ─── Challenge modes ──────────────────────────────────────────────────────────

/**
 * Describes how a provider's widget model works.
 *
 * - `"managed"` — A visible widget (checkbox, image puzzle). The challenge
 *   fires automatically on user interaction. Calling `execute()` returns the
 *   current token or waits for the next success.
 *
 * - `"interactive"` — An invisible widget. No challenge starts until
 *   `execute()` is called explicitly (typically on form submit). The provider
 *   may briefly display an overlay to complete the check.
 *
 * - `"passive"` — Score-based, fully invisible. `execute()` fires immediately
 *   and resolves with a scored token — no user interaction required. No
 *   container element is needed in the DOM.
 */
export type CaptchaMode = "managed" | "interactive" | "passive";

// ─── Adapter config ───────────────────────────────────────────────────────────

/** Minimum configuration shared by all provider adapters. */
export interface AdapterConfig {
  siteKey: string;
}

// ─── Token ────────────────────────────────────────────────────────────────────

/** A token issued after a challenge completes successfully. */
export interface CaptchaToken {
  /** The raw token string to be forwarded to the server for verification. */
  value: string;
  provider: ProviderId;
  /** Unix timestamp (ms) at which this token was issued. */
  issuedAt: number;
}

// ─── Verification ─────────────────────────────────────────────────────────────

/** Options for server-side token verification. */
export interface VerifyOptions {
  /**
   * The end user's IP address. Passed to the provider where supported as
   * an additional fraud signal. Not logged or stored by captigo itself.
   */
  remoteip?: string;
}

/** The result of server-side token verification. */
export interface VerifyResult {
  success: boolean;
  provider: ProviderId;
  /** ISO 8601 challenge completion timestamp, if returned by the provider. */
  challengeTs?: string;
  hostname?: string;
  /**
   * Confidence score from score-based providers (Turnstile, reCAPTCHA v3).
   * Range: 0.0 (likely bot) → 1.0 (likely human).
   * Undefined for checkbox providers that do not return a score.
   */
  score?: number;
  errorCodes?: string[];
}

// ─── Adapter metadata ─────────────────────────────────────────────────────────

/** Static, config-derived metadata about a provider adapter instance. */
export interface AdapterMeta {
  id: ProviderId;
  mode: CaptchaMode;
  /**
   * Whether the adapter expects a DOM container element.
   * Passive (score-based) adapters set this to `false` — they load a script
   * but render nothing visible.
   */
  requiresContainer: boolean;
}
