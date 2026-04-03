import type {
  CaptchaProvider,
  CaptchaProviderConfig,
  CaptchaVerifyResult,
  VerifyOptions,
} from "captigo";

// ─── Config ───────────────────────────────────────────────────────────────────

export interface TurnstileConfig extends CaptchaProviderConfig {
  /**
   * Widget appearance theme.
   * @default "auto"
   */
  theme?: "light" | "dark" | "auto";
  /**
   * Widget size.
   * @default "normal"
   */
  size?: "normal" | "compact";
  /**
   * Widget language override (e.g. "en", "de").
   * Defaults to the user's browser language.
   */
  language?: string;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export class TurnstileProvider implements CaptchaProvider<TurnstileConfig> {
  readonly name = "turnstile";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<CaptchaVerifyResult> {
    // TODO: implement using @captigo/shared postVerify
    void VERIFY_URL;
    throw new Error("@captigo/turnstile: verify() is not yet implemented");
  }
}

/**
 * Create a Turnstile provider instance.
 *
 * @example
 * ```ts
 * import { turnstile } from "@captigo/turnstile";
 *
 * const provider = turnstile({ siteKey: "0x..." });
 * const result = await provider.verify(token, process.env.TURNSTILE_SECRET);
 * ```
 */
export function turnstile(_config: TurnstileConfig): TurnstileProvider {
  return new TurnstileProvider();
}
