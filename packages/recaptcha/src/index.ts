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

/** reCAPTCHA v2 — visible checkbox or invisible challenge. */
export interface ReCaptchaV2Config extends AdapterConfig {
  version: "v2";
  /**
   * - `"checkbox"` (default) — visible "I'm not a robot" checkbox.
   * - `"invisible"` — invisible widget, requires `widget.execute()`.
   */
  mode?: "checkbox" | "invisible";
  /** @default "light" */
  theme?: "light" | "dark";
  /** @default "normal" */
  size?: "normal" | "compact";
}

/** reCAPTCHA v3 — score-based, fully invisible. */
export interface ReCaptchaV3Config extends AdapterConfig {
  version: "v3";
  /**
   * Default action label associated with this adapter (e.g. `"login"`).
   * Can be overridden per `widget.execute(action)` call.
   */
  action?: string;
  /**
   * Minimum score to treat as human. Checked during server-side `verify()`.
   * Range: 0.0–1.0.
   * @default 0.5
   */
  scoreThreshold?: number;
}

export type ReCaptchaConfig = ReCaptchaV2Config | ReCaptchaV3Config;

// ─── Adapter ──────────────────────────────────────────────────────────────────

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

class ReCaptchaAdapter implements CaptchaAdapter<ReCaptchaConfig> {
  readonly meta: AdapterMeta;

  constructor(private readonly config: ReCaptchaConfig) {
    this.meta = {
      id: config.version === "v3" ? "recaptcha-v3" : "recaptcha-v2",
      mode:
        config.version === "v3"
          ? "passive"
          : config.mode === "invisible"
            ? "interactive"
            : "managed",
      // v3 loads a script but needs no container element in the DOM
      requiresContainer: config.version !== "v3",
    };
  }

  render(_container: HTMLElement, _options: RenderOptions<ReCaptchaConfig>): CaptchaWidget {
    // TODO: load reCAPTCHA script, call grecaptcha.render() (v2) or grecaptcha.execute() (v3)
    void VERIFY_URL;
    throw new CaptchaError("not-implemented", "render() not yet implemented", this.meta.id);
  }

  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<VerifyResult> {
    // TODO: implement using @captigo/shared postVerify
    // For v3: also check result.score >= config.scoreThreshold
    throw new CaptchaError("not-implemented", "verify() not yet implemented", this.meta.id);
  }
}

/**
 * Create a Google reCAPTCHA adapter (v2 or v3).
 *
 * @example
 * ```ts
 * import { recaptcha } from "@captigo/recaptcha";
 *
 * // v2 checkbox
 * const adapter = recaptcha({ version: "v2", siteKey: "6Le..." });
 *
 * // v3 score-based
 * const adapter = recaptcha({ version: "v3", siteKey: "6Le...", action: "login" });
 * ```
 */
export const recaptcha: AdapterFactory<ReCaptchaConfig> = (config) =>
  new ReCaptchaAdapter(config);
