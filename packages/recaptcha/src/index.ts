import type {
  CaptchaProvider,
  CaptchaProviderConfig,
  CaptchaVerifyResult,
  VerifyOptions,
} from "captigo";

// ─── Config ───────────────────────────────────────────────────────────────────

/** reCAPTCHA v2 ("I'm not a robot" checkbox). */
export interface ReCaptchaV2Config extends CaptchaProviderConfig {
  version: "v2";
  /**
   * Widget theme.
   * @default "light"
   */
  theme?: "light" | "dark";
  /**
   * Widget size.
   * @default "normal"
   */
  size?: "normal" | "compact";
}

/** reCAPTCHA v3 (invisible, score-based). */
export interface ReCaptchaV3Config extends CaptchaProviderConfig {
  version: "v3";
  /**
   * The action name to associate with this verification.
   * Used in the admin console to filter by interaction type.
   */
  action?: string;
  /**
   * Minimum score threshold to treat as human (0.0–1.0).
   * @default 0.5
   */
  scoreThreshold?: number;
}

export type ReCaptchaConfig = ReCaptchaV2Config | ReCaptchaV3Config;

// ─── Provider ─────────────────────────────────────────────────────────────────

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export class ReCaptchaProvider implements CaptchaProvider<ReCaptchaConfig> {
  readonly name = "recaptcha";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<CaptchaVerifyResult> {
    // TODO: implement using @captigo/shared postVerify
    // v3 should additionally check result.score >= config.scoreThreshold
    void VERIFY_URL;
    throw new Error("@captigo/recaptcha: verify() is not yet implemented");
  }
}

/**
 * Create a reCAPTCHA provider instance.
 *
 * @example
 * ```ts
 * import { recaptcha } from "@captigo/recaptcha";
 *
 * // v2
 * const provider = recaptcha({ version: "v2", siteKey: "6Le..." });
 *
 * // v3
 * const provider = recaptcha({ version: "v3", siteKey: "6Le...", action: "login" });
 * ```
 */
export function recaptcha(_config: ReCaptchaConfig): ReCaptchaProvider {
  return new ReCaptchaProvider();
}
