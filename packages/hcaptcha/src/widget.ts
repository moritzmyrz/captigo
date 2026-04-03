import { CaptchaError } from "captigo";
import type { CaptchaToken, CaptchaWidget, WidgetCallbacks } from "captigo";

import { loadScript } from "./script.js";
import type { HCaptchaConfig } from "./config.js";

type Pending = {
  resolve: (token: CaptchaToken) => void;
  reject: (error: CaptchaError) => void;
};

/**
 * Stateful handle to a mounted hCaptcha widget.
 * Created by `HCaptchaAdapter.render()`; do not instantiate directly.
 */
export class HCaptchaWidget implements CaptchaWidget {
  private widgetId: string | null = null;
  private token: CaptchaToken | null = null;
  private readonly pending: Pending[] = [];
  private isExecuting = false;
  private destroyed = false;

  private readonly ready: Promise<void>;

  constructor(
    private readonly container: HTMLElement,
    private readonly config: HCaptchaConfig,
    private readonly callbacks: WidgetCallbacks,
  ) {
    this.ready = this.mount();
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async mount(): Promise<void> {
    await loadScript();
    if (this.destroyed) return;

    const sdk = window.hcaptcha!;

    this.widgetId = sdk.render(this.container, {
      sitekey: this.config.siteKey,
      theme: this.config.theme,
      size: this.config.size ?? "normal",
      tabindex: this.config.tabindex,
      languageoverride: this.config.language,
      endpoint: this.config.endpoint,

      callback: (rawToken) => {
        const token: CaptchaToken = {
          value: rawToken,
          provider: "hcaptcha",
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

      // Fires for invisible mode when the challenge popup times out before
      // the user solves it. We reject any waiting execute() callers.
      "chalexpired-callback": () => {
        this.isExecuting = false;
        this.rejectAll(
          new CaptchaError(
            "execute-failed",
            "hCaptcha challenge expired before completion.",
            "hcaptcha",
          ),
        );
      },

      "error-callback": (errCode) => {
        const error = new CaptchaError(
          "provider-error",
          `hCaptcha error: ${errCode}`,
          "hcaptcha",
        );
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

  // ─── CaptchaWidget ───────────────────────────────────────────────────────────

  execute(_action?: string): Promise<CaptchaToken> {
    // hCaptcha v2 does not support per-execute action labels.
    if (this.destroyed) {
      return Promise.reject(
        new CaptchaError("execute-failed", "Widget has been destroyed.", "hcaptcha"),
      );
    }

    if (this.token) return Promise.resolve(this.token);

    return new Promise<CaptchaToken>((resolve, reject) => {
      this.pending.push({ resolve, reject });

      if (this.isExecuting) return;

      this.ready
        .then(() => {
          if (this.destroyed || !this.widgetId) return;
          if (this.token) { this.resolveAll(this.token); return; }

          if (this.config.size === "invisible" && !this.isExecuting) {
            this.isExecuting = true;
            window.hcaptcha!.execute(this.widgetId);
          }
          // normal/compact: wait for the user-driven callback
        })
        .catch((err: unknown) => {
          const error = new CaptchaError(
            "script-load-failed",
            err instanceof Error ? err.message : String(err),
            "hcaptcha",
          );
          this.rejectAll(error);
          this.callbacks.onError?.(error);
        });
    });
  }

  reset(): void {
    if (this.widgetId && window.hcaptcha) {
      window.hcaptcha.reset(this.widgetId);
    }
    this.token = null;
    this.isExecuting = false;
    this.rejectAll(new CaptchaError("execute-failed", "Widget was reset.", "hcaptcha"));
  }

  destroy(): void {
    if (this.widgetId && window.hcaptcha) {
      window.hcaptcha.remove(this.widgetId);
      this.widgetId = null;
    }
    this.token = null;
    this.destroyed = true;
    this.isExecuting = false;
    this.rejectAll(new CaptchaError("execute-failed", "Widget was destroyed.", "hcaptcha"));
  }

  getToken(): CaptchaToken | null {
    return this.token;
  }
}
