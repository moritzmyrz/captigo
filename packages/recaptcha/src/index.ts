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

export interface ReCaptchaV2Config extends AdapterConfig {
  version: "v2";
  /** @default "checkbox" */
  mode?: "checkbox" | "invisible";
  /** @default "light" */
  theme?: "light" | "dark";
  /** @default "normal" */
  size?: "normal" | "compact";
}

export interface ReCaptchaV3Config extends AdapterConfig {
  version: "v3";
  action?: string;
  /** @default 0.5 */
  scoreThreshold?: number;
}

export type ReCaptchaConfig = ReCaptchaV2Config | ReCaptchaV3Config;

// ─── Adapter ──────────────────────────────────────────────────────────────────

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

class ReCaptchaAdapter implements CaptchaAdapter<ReCaptchaConfig> {
  readonly meta: AdapterMeta;
  readonly config: ReCaptchaConfig;

  constructor(config: ReCaptchaConfig) {
    this.config = config;
    this.meta = {
      id: config.version === "v3" ? "recaptcha-v3" : "recaptcha-v2",
      mode:
        config.version === "v3"
          ? "passive"
          : config.mode === "invisible"
            ? "interactive"
            : "managed",
      requiresContainer: config.version !== "v3",
    };
  }

  render(_container: HTMLElement, _options: RenderOptions): CaptchaWidget {
    void VERIFY_URL;
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

export const recaptcha: AdapterFactory<ReCaptchaConfig> = (config) =>
  new ReCaptchaAdapter(config);
