import type {
  AdapterMeta,
  CaptchaAdapter,
  CaptchaWidget,
  RenderOptions,
  VerifyOptions,
  VerifyResult,
} from "@captigo/core";

import type { ReCaptchaV3Config } from "./config.js";
import { verifyV3Token } from "./verify.js";
import { ReCaptchaV3Widget } from "./widget-v3.js";

class ReCaptchaV3Adapter implements CaptchaAdapter<ReCaptchaV3Config> {
  readonly meta: AdapterMeta;
  readonly config: ReCaptchaV3Config;

  constructor(config: ReCaptchaV3Config) {
    this.config = config;
    this.meta = {
      id: "recaptcha-v3",
      mode: "passive",
      // v3 has no visible widget — the container argument to render() is ignored.
      requiresContainer: false,
    };
  }

  render(_container: HTMLElement, options: RenderOptions): CaptchaWidget {
    return new ReCaptchaV3Widget(this.config, options.callbacks);
  }

  verify(token: string, secretKey: string, options?: VerifyOptions): Promise<VerifyResult> {
    return verifyV3Token(token, secretKey, options);
  }
}

/**
 * Create a reCAPTCHA v3 adapter.
 *
 * v3 is passive (score-based) — no widget is shown. Call `widget.execute(action)`
 * on each sensitive action to receive a token + score from Google.
 *
 * Always verify server-side and check `result.score`. Google recommends rejecting
 * scores below `0.5` for most use cases.
 *
 * @example
 * ```ts
 * import { recaptchaV3 } from "@captigo/recaptcha";
 *
 * const adapter = recaptchaV3({ siteKey: "6Lc...", action: "login" });
 *
 * // Client-side (meta.requiresContainer is false — container is ignored)
 * const widget = adapter.render(document.body, {
 *   callbacks: { onSuccess: (token) => submitWithToken(token.value) },
 * });
 *
 * // Per action:
 * const token = await widget.execute("checkout");
 *
 * // Server-side
 * const result = await adapter.verify(token, process.env.RECAPTCHA_SECRET!);
 * if (!result.success || (result.score ?? 0) < 0.5) {
 *   return new Response("Suspicious request", { status: 403 });
 * }
 * ```
 */
export function recaptchaV3(config: ReCaptchaV3Config): CaptchaAdapter<ReCaptchaV3Config> {
  return new ReCaptchaV3Adapter(config);
}
