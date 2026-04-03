import type {
  AdapterMeta,
  CaptchaAdapter,
  CaptchaWidget,
  RenderOptions,
  VerifyOptions,
  VerifyResult,
} from "@captigo/core";

import type { HCaptchaConfig } from "./config.js";
import { verifyToken } from "./verify.js";
import { HCaptchaWidget } from "./widget.js";

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

  render(container: HTMLElement, options: RenderOptions): CaptchaWidget {
    return new HCaptchaWidget(container, this.config, options.callbacks);
  }

  verify(token: string, secretKey: string, options?: VerifyOptions): Promise<VerifyResult> {
    return verifyToken(token, secretKey, options);
  }
}

/**
 * Create an hCaptcha adapter.
 *
 * @example
 * ```ts
 * import { hcaptcha } from "@captigo/hcaptcha";
 *
 * const adapter = hcaptcha({ siteKey: "your-site-key" });
 *
 * // Client-side
 * const widget = adapter.render(container, {
 *   callbacks: { onSuccess: (token) => submitForm(token.value) },
 * });
 *
 * // Server-side
 * const result = await adapter.verify(token, process.env.HCAPTCHA_SECRET!);
 * if (!result.success) return new Response("CAPTCHA failed", { status: 400 });
 * ```
 */
export function hcaptcha(config: HCaptchaConfig): CaptchaAdapter<HCaptchaConfig> {
  return new HCaptchaAdapter(config);
}
