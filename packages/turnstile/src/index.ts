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

export interface TurnstileConfig extends AdapterConfig {
  /**
   * Widget appearance theme.
   * @default "auto"
   */
  theme?: "light" | "dark" | "auto";
  /**
   * Controls when the challenge fires.
   * - `"render"` (default) — visible managed widget, fires automatically.
   * - `"execute"` — invisible widget, fires only when `widget.execute()` is called.
   */
  execution?: "render" | "execute";
  /**
   * Widget language override (e.g. `"en"`, `"de"`).
   * Defaults to the visitor's browser language.
   */
  language?: string;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

class TurnstileAdapter implements CaptchaAdapter<TurnstileConfig> {
  readonly meta: AdapterMeta;

  constructor(private readonly config: TurnstileConfig) {
    this.meta = {
      id: "turnstile",
      // execution: "execute" = invisible, requires widget.execute() call
      mode: config.execution === "execute" ? "interactive" : "managed",
      requiresContainer: true,
    };
  }

  render(_container: HTMLElement, _options: RenderOptions<TurnstileConfig>): CaptchaWidget {
    // TODO: load Cloudflare script, call window.turnstile.render()
    void VERIFY_URL;
    throw new CaptchaError("not-implemented", "render() not yet implemented", this.meta.id);
  }

  async verify(
    _token: string,
    _secretKey: string,
    _options?: VerifyOptions,
  ): Promise<VerifyResult> {
    // TODO: implement using @captigo/shared postVerify(VERIFY_URL, ...)
    throw new CaptchaError("not-implemented", "verify() not yet implemented", this.meta.id);
  }
}

/**
 * Create a Cloudflare Turnstile adapter.
 *
 * @example
 * ```ts
 * import { turnstile } from "@captigo/turnstile";
 *
 * const adapter = turnstile({ siteKey: "0x..." });
 *
 * // Client
 * const widget = adapter.render(container, { config, callbacks });
 *
 * // Server
 * const result = await adapter.verify(token, process.env.TURNSTILE_SECRET!);
 * ```
 */
export const turnstile: AdapterFactory<TurnstileConfig> = (config) =>
  new TurnstileAdapter(config);
