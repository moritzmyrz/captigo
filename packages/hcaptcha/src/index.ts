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
  /**
   * Widget theme.
   * @default "light"
   */
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

  constructor(private readonly config: HCaptchaConfig) {
    this.meta = {
      id: "hcaptcha",
      // size: "invisible" requires an explicit widget.execute() call
      mode: config.size === "invisible" ? "interactive" : "managed",
      requiresContainer: true,
    };
  }

  render(_container: HTMLElement, _options: RenderOptions<HCaptchaConfig>): CaptchaWidget {
    // TODO: load hCaptcha script, call hcaptcha.render()
    void DEFAULT_ENDPOINT;
    void VERIFY_PATH;
    throw new CaptchaError("not-implemented", "render() not yet implemented", this.meta.id);
  }

  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<VerifyResult> {
    // TODO: implement using @captigo/shared postVerify(endpoint + VERIFY_PATH, ...)
    throw new CaptchaError("not-implemented", "verify() not yet implemented", this.meta.id);
  }
}

/**
 * Create an hCaptcha adapter.
 *
 * @example
 * ```ts
 * import { hcaptcha } from "@captigo/hcaptcha";
 *
 * const adapter = hcaptcha({ siteKey: "10000000-ffff-ffff-ffff-000000000001" });
 *
 * // Client
 * const widget = adapter.render(container, { config, callbacks });
 *
 * // Server
 * const result = await adapter.verify(token, process.env.HCAPTCHA_SECRET!);
 * ```
 */
export const hcaptcha: AdapterFactory<HCaptchaConfig> = (config) =>
  new HCaptchaAdapter(config);
