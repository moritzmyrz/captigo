import type {
  AdapterMeta,
  CaptchaAdapter,
  CaptchaWidget,
  RenderOptions,
  VerifyOptions,
  VerifyResult,
} from "captigo";

import type { ReCaptchaV2Config } from "./config.js";
import { verifyV2Token } from "./verify.js";
import { ReCaptchaV2Widget } from "./widget-v2.js";

class ReCaptchaV2Adapter implements CaptchaAdapter<ReCaptchaV2Config> {
  readonly meta: AdapterMeta;
  readonly config: ReCaptchaV2Config;

  constructor(config: ReCaptchaV2Config) {
    this.config = config;
    this.meta = {
      id: "recaptcha-v2",
      mode: config.size === "invisible" ? "interactive" : "managed",
      requiresContainer: true,
    };
  }

  render(container: HTMLElement, options: RenderOptions): CaptchaWidget {
    return new ReCaptchaV2Widget(container, this.config, options.callbacks);
  }

  verify(token: string, secretKey: string, options?: VerifyOptions): Promise<VerifyResult> {
    return verifyV2Token(token, secretKey, options);
  }
}

/**
 * Create a reCAPTCHA v2 adapter.
 *
 * @example
 * ```ts
 * import { recaptchaV2 } from "@captigo/recaptcha";
 *
 * const adapter = recaptchaV2({ siteKey: "6Lc..." });
 *
 * // Invisible mode:
 * const adapter = recaptchaV2({ siteKey: "6Lc...", size: "invisible" });
 * const token = await widget.execute();
 * ```
 */
export function recaptchaV2(config: ReCaptchaV2Config): CaptchaAdapter<ReCaptchaV2Config> {
  return new ReCaptchaV2Adapter(config);
}
