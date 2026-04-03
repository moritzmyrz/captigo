import { CaptchaError } from "captigo";
import type { CaptchaToken, CaptchaWidget, WidgetCallbacks } from "captigo";

import { loadV2Script } from "./script.js";
import type { ReCaptchaV2Config } from "./config.js";

type Pending = {
  resolve: (token: CaptchaToken) => void;
  reject: (error: CaptchaError) => void;
};

/**
 * Stateful handle to a mounted reCAPTCHA v2 widget.
 * Created by `recaptchaV2()`'s adapter; do not instantiate directly.
 *
 * Notable difference from Turnstile/hCaptcha: reCAPTCHA v2 widget IDs are
 * **numbers**, not strings.
 */
export class ReCaptchaV2Widget implements CaptchaWidget {
  // grecaptcha.render() returns a numeric widget ID.
  private widgetId: number | null = null;
  private token: CaptchaToken | null = null;
  private readonly pending: Pending[] = [];
  private isExecuting = false;
  private destroyed = false;

  private readonly ready: Promise<void>;

  constructor(
    private readonly container: HTMLElement,
    private readonly config: ReCaptchaV2Config,
    private readonly callbacks: WidgetCallbacks,
  ) {
    this.ready = this.mount();
  }

  private async mount(): Promise<void> {
    await loadV2Script();
    if (this.destroyed) return;

    const sdk = window.grecaptcha!;

    this.widgetId = sdk.render(this.container, {
      sitekey: this.config.siteKey,
      theme: this.config.theme,
      // reCAPTCHA v2 uses "normal" for the standard checkbox size.
      size: this.config.size === "checkbox" ? "normal" : (this.config.size ?? "normal"),
      badge: this.config.badge,
      tabindex: this.config.tabindex,
      hl: this.config.language,

      callback: (rawToken) => {
        const token: CaptchaToken = {
          value: rawToken,
          provider: "recaptcha-v2",
          issuedAt: Date.now(),
        };
        this.token = token;
        this.isExecuting = false;
        this.callbacks.onSuccess(token);
        this.resolveAll(token);
      },

      "expired-callback": () => {
        this.token = null;
        this.callbacks.onExpire?.();
      },

      "error-callback": () => {
        const error = new CaptchaError("provider-error", "reCAPTCHA v2 error.", "recaptcha-v2");
        this.isExecuting = false;
        this.callbacks.onError?.(error);
        this.rejectAll(error);
      },
    });
  }

  private resolveAll(token: CaptchaToken): void {
    const batch = this.pending.splice(0);
    for (const { resolve } of batch) resolve(token);
  }

  private rejectAll(error: CaptchaError): void {
    const batch = this.pending.splice(0);
    for (const { reject } of batch) reject(error);
  }

  execute(_action?: string): Promise<CaptchaToken> {
    // reCAPTCHA v2 does not support action labels.
    if (this.destroyed) {
      return Promise.reject(
        new CaptchaError("execute-failed", "Widget has been destroyed.", "recaptcha-v2"),
      );
    }

    if (this.token) return Promise.resolve(this.token);

    return new Promise<CaptchaToken>((resolve, reject) => {
      this.pending.push({ resolve, reject });

      if (this.isExecuting) return;

      this.ready
        .then(() => {
          if (this.destroyed || this.widgetId === null) return;
          if (this.token) { this.resolveAll(this.token); return; }

          if (this.config.size === "invisible" && !this.isExecuting) {
            this.isExecuting = true;
            window.grecaptcha!.execute(this.widgetId);
          }
          // checkbox/compact: wait for user interaction
        })
        .catch((err: unknown) => {
          const error = new CaptchaError(
            "script-load-failed",
            err instanceof Error ? err.message : String(err),
            "recaptcha-v2",
          );
          this.rejectAll(error);
          this.callbacks.onError?.(error);
        });
    });
  }

  reset(): void {
    if (this.widgetId !== null && window.grecaptcha) {
      window.grecaptcha.reset(this.widgetId);
    }
    this.token = null;
    this.isExecuting = false;
    this.rejectAll(new CaptchaError("execute-failed", "Widget was reset.", "recaptcha-v2"));
  }

  destroy(): void {
    // reCAPTCHA v2 does not have a `remove()` API — we can only reset.
    if (this.widgetId !== null && window.grecaptcha) {
      window.grecaptcha.reset(this.widgetId);
    }
    this.widgetId = null;
    this.token = null;
    this.destroyed = true;
    this.isExecuting = false;
    this.rejectAll(new CaptchaError("execute-failed", "Widget was destroyed.", "recaptcha-v2"));
  }

  getToken(): CaptchaToken | null {
    return this.token;
  }
}
