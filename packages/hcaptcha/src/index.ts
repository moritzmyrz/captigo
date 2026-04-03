import type {
  CaptchaProvider,
  CaptchaProviderConfig,
  CaptchaVerifyResult,
  VerifyOptions,
} from "captigo";

// ─── Config ───────────────────────────────────────────────────────────────────

export interface HCaptchaConfig extends CaptchaProviderConfig {
  /**
   * hCaptcha endpoint override (e.g. for enterprise).
   * @default "https://hcaptcha.com"
   */
  endpoint?: string;
  /**
   * Widget size.
   * @default "normal"
   */
  size?: "normal" | "compact" | "invisible";
  /**
   * Widget theme.
   * @default "light"
   */
  theme?: "light" | "dark";
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const DEFAULT_ENDPOINT = "https://hcaptcha.com";
const VERIFY_PATH = "/siteverify";

export class HCaptchaProvider implements CaptchaProvider<HCaptchaConfig> {
  readonly name = "hcaptcha";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<CaptchaVerifyResult> {
    // TODO: implement using @captigo/shared postVerify
    void DEFAULT_ENDPOINT;
    void VERIFY_PATH;
    throw new Error("@captigo/hcaptcha: verify() is not yet implemented");
  }
}

/**
 * Create an hCaptcha provider instance.
 *
 * @example
 * ```ts
 * import { hcaptcha } from "@captigo/hcaptcha";
 *
 * const provider = hcaptcha({ siteKey: "10000000-ffff-ffff-ffff-000000000001" });
 * const result = await provider.verify(token, process.env.HCAPTCHA_SECRET);
 * ```
 */
export function hcaptcha(_config: HCaptchaConfig): HCaptchaProvider {
  return new HCaptchaProvider();
}
