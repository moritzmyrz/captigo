// ─── Provider config ─────────────────────────────────────────────────────────

/** Base configuration every provider config extends. */
export interface CaptchaProviderConfig {
  siteKey: string;
}

// ─── Token ───────────────────────────────────────────────────────────────────

/** A token produced by a successful widget challenge. */
export interface CaptchaToken {
  /** The raw token string sent to the server for verification. */
  value: string;
  /** Which provider issued this token. */
  provider: string;
  /** Unix timestamp (ms) at which the token was issued. */
  issuedAt: number;
}

// ─── Widget ──────────────────────────────────────────────────────────────────

/** Lifecycle callbacks passed to widget instances. */
export interface CaptchaCallbacks {
  onSuccess?: (token: CaptchaToken) => void;
  onError?: (error: unknown) => void;
  onExpire?: () => void;
}

// ─── Verification ────────────────────────────────────────────────────────────

/** Options for server-side token verification. */
export interface VerifyOptions {
  /** The user's IP address, forwarded to the provider when supported. */
  remoteip?: string;
}

/** The result of server-side token verification. */
export interface CaptchaVerifyResult {
  success: boolean;
  /** Which provider performed the verification. */
  provider: string;
  /** ISO 8601 timestamp of the challenge, if returned by the provider. */
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
}

// ─── Provider interface ───────────────────────────────────────────────────────

/**
 * The contract every provider adapter must satisfy.
 *
 * Adapters are responsible for server-side verification only. Widget rendering
 * is handled by framework-specific packages (`@captigo/react`, etc.).
 */
export interface CaptchaProvider<
  TConfig extends CaptchaProviderConfig = CaptchaProviderConfig,
> {
  /** Unique identifier for this provider (e.g. "turnstile", "hcaptcha"). */
  readonly name: string;

  /**
   * Verify a token received from the client against the provider's API.
   * Should be called server-side only.
   */
  verify(
    token: string,
    secretKey: string,
    options?: VerifyOptions,
  ): Promise<CaptchaVerifyResult>;
}

/** A factory function that produces a configured CaptchaProvider instance. */
export type CaptchaProviderFactory<
  TConfig extends CaptchaProviderConfig = CaptchaProviderConfig,
> = (config: TConfig) => CaptchaProvider<TConfig>;
