import type {
  AdapterMeta,
  CaptchaAdapter,
  CaptchaWidget,
  RenderOptions,
  VerifyOptions,
  VerifyResult,
} from "captigo";

import type { TurnstileConfig } from "./config.js";
import { verifyToken } from "./verify.js";
import { TurnstileWidget } from "./widget.js";

// ─── Adapter ──────────────────────────────────────────────────────────────────

class TurnstileAdapter implements CaptchaAdapter<TurnstileConfig> {
  readonly meta: AdapterMeta;
  readonly config: TurnstileConfig;

  constructor(config: TurnstileConfig) {
    this.config = config;
    this.meta = {
      id: "turnstile",
      // execution: "execute" → invisible widget that requires widget.execute()
      mode: config.execution === "execute" ? "interactive" : "managed",
      requiresContainer: true,
    };
  }

  render(container: HTMLElement, options: RenderOptions): CaptchaWidget {
    return new TurnstileWidget(container, this.config, options.callbacks);
  }

  verify(token: string, secretKey: string, options?: VerifyOptions): Promise<VerifyResult> {
    return verifyToken(token, secretKey, options);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a Cloudflare Turnstile adapter.
 *
 * @example
 * ```ts
 * import { turnstile } from "@captigo/turnstile";
 *
 * const adapter = turnstile({ siteKey: "0x..." });
 *
 * // Client-side
 * const widget = adapter.render(container, {
 *   callbacks: {
 *     onSuccess: (token) => submitForm(token.value),
 *     onExpire: () => reset(),
 *   },
 * });
 *
 * // Server-side (e.g. in an API route)
 * const result = await adapter.verify(token, process.env.TURNSTILE_SECRET!);
 * if (!result.success) return new Response("CAPTCHA failed", { status: 400 });
 * ```
 */
export function turnstile(config: TurnstileConfig): CaptchaAdapter<TurnstileConfig> {
  return new TurnstileAdapter(config);
}
