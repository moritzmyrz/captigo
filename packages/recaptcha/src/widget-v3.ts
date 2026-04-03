import { CaptchaError } from "captigo";
import type { CaptchaToken, CaptchaWidget, WidgetCallbacks } from "captigo";

import { loadV3Script, whenReady } from "./script.js";
import type { ReCaptchaV3Config } from "./config.js";

/**
 * reCAPTCHA v3 "widget" — a stateless token executor.
 *
 * There is no DOM widget to render. Each `execute()` call reaches out to
 * Google and returns a fresh score-based token. The container passed to the
 * adapter is ignored (`meta.requiresContainer === false`).
 *
 * The `onSuccess` callback fires each time a token is produced, making it
 * compatible with the same callback pattern used by v2 and other providers.
 */
export class ReCaptchaV3Widget implements CaptchaWidget {
  private lastToken: CaptchaToken | null = null;
  private destroyed = false;

  /**
   * Resolves when the v3 script is loaded AND grecaptcha is fully initialized.
   * Keeps the execute() path simple and sequential.
   */
  private readonly ready: Promise<void>;

  constructor(
    private readonly config: ReCaptchaV3Config,
    private readonly callbacks: WidgetCallbacks,
  ) {
    this.ready = loadV3Script(config.siteKey).then(() => whenReady());
  }

  execute(action?: string): Promise<CaptchaToken> {
    if (this.destroyed) {
      return Promise.reject(
        new CaptchaError("execute-failed", "Widget has been destroyed.", "recaptcha-v3"),
      );
    }

    const resolvedAction = action ?? this.config.action ?? "default";

    return this.ready
      .then(() => {
        // grecaptcha.execute(siteKey, { action }) is the v3 overload.
        return (window.grecaptcha!.execute as (k: string, o: { action: string }) => Promise<string>)(
          this.config.siteKey,
          { action: resolvedAction },
        );
      })
      .then((rawToken) => {
        const token: CaptchaToken = {
          value: rawToken,
          provider: "recaptcha-v3",
          issuedAt: Date.now(),
        };
        this.lastToken = token;
        this.callbacks.onSuccess(token);
        return token;
      })
      .catch((err: unknown) => {
        if (err instanceof CaptchaError) throw err;
        const error = new CaptchaError(
          "execute-failed",
          err instanceof Error ? err.message : String(err),
          "recaptcha-v3",
        );
        this.callbacks.onError?.(error);
        throw error;
      });
  }

  reset(): void {
    // v3 tokens are fetched on demand — there is nothing to reset.
    this.lastToken = null;
  }

  destroy(): void {
    // v3 leaves no DOM element to remove.
    this.destroyed = true;
    this.lastToken = null;
  }

  getToken(): CaptchaToken | null {
    return this.lastToken;
  }
}
