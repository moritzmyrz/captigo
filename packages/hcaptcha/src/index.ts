import { CaptchaError } from "captigo";
import type {
  AdapterConfig,
  AdapterFactory,
  AdapterMeta,
  CaptchaAdapter,
  CaptchaWidget,
  RenderOptions,
  VerifyOptions,
  VerifyResult,
} from "captigo";

// ─── Config ───────────────────────────────────────────────────────────────────

export interface HCaptchaConfig extends AdapterConfig {
  /**
   * Widget size and visibility.
   * - `"normal"` (default) — visible checkbox.
   * - `"compact"` — smaller visible checkbox.
   * - `"invisible"` — no visible element; requires `widget.execute()`.
   */
  size?: "normal" | "compact" | "invisible";
  /** @default "light" */
  theme?: "light" | "dark";
  /**
   * hCaptcha endpoint override for enterprise plans.
   * @default "https://hcaptcha.com"
   */
  endpoint?: string;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

const DEFAULT_ENDPOINT = "https://hcaptcha.com";
const VERIFY_PATH = "/siteverify";

class HCaptchaAdapter implements CaptchaAdapter<HCaptchaConfig> {
  readonly meta: AdapterMeta;
  readonly config: HCaptchaConfig;

  constructor(config: HCaptchaConfig) {
    this.config = config;
    this.meta = {
      id: "hcaptcha",
      mode: config.size === "invisible" ? "interactive" : "managed",
      requiresContainer: true,
    };
  }

  render(_container: HTMLElement, _options: RenderOptions): CaptchaWidget {
    void DEFAULT_ENDPOINT;
    void VERIFY_PATH;
    throw new CaptchaError("not-implemented", "render() not yet implemented", this.meta.id);
  }

  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<VerifyResult> {
    throw new CaptchaError("not-implemented", "verify() not yet implemented", this.meta.id);
  }
}

export const hcaptcha: AdapterFactory<HCaptchaConfig> = (config) =>
  new HCaptchaAdapter(config);
