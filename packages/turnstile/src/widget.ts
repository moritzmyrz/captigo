import { CaptchaError } from "@captigo/core";
import type { CaptchaToken, CaptchaWidget, WidgetCallbacks } from "@captigo/core";

import type { TurnstileConfig } from "./config.js";
import { loadScript } from "./script.js";

// ─── Internal types ───────────────────────────────────────────────────────────

type Pending = {
  resolve: (token: CaptchaToken) => void;
  reject: (error: CaptchaError) => void;
};

// ─── Widget ───────────────────────────────────────────────────────────────────

/**
 * Stateful handle to a mounted Turnstile widget.
 * Created by `TurnstileAdapter.render()`; do not instantiate directly.
 */
export class TurnstileWidget implements CaptchaWidget {
  private widgetId: string | null = null;
  private token: CaptchaToken | null = null;
  private readonly pending: Pending[] = [];
  private isExecuting = false;
  private destroyed = false;

  /**
   * Resolves when the SDK script is loaded and the widget is rendered.
   * Rejects if the script fails to load.
   */
  private readonly ready: Promise<void>;

  constructor(
    private readonly container: HTMLElement,
    private readonly config: TurnstileConfig,
    private readonly callbacks: WidgetCallbacks,
  ) {
    this.ready = this.mount();

    // Notify via onError as soon as mount fails so managed-mode consumers
    // (who never call execute()) still receive the signal. The execute() path
    // also chains on this.ready, but only calls rejectAll — not onError again.
    this.ready.catch((err: unknown) => {
      if (this.destroyed) return;
      const error =
        err instanceof CaptchaError
          ? err
          : new CaptchaError(
              "script-load-failed",
              err instanceof Error ? err.message : String(err),
              "turnstile",
            );
      this.callbacks.onError?.(error);
    });
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async mount(): Promise<void> {
    await loadScript();
    if (this.destroyed) return;

    const sdk = window.turnstile;
    if (!sdk) {
      throw new CaptchaError(
        "script-load-failed",
        "Turnstile SDK not available after script load.",
        "turnstile",
      );
    }

    this.widgetId = sdk.render(this.container, {
      sitekey: this.config.siteKey,
      execution: this.config.execution ?? "render",
      ...(this.config.theme !== undefined && { theme: this.config.theme }),
      ...(this.config.language !== undefined && { language: this.config.language }),
      ...(this.config.size !== undefined && { size: this.config.size }),
      ...(this.config.appearance !== undefined && { appearance: this.config.appearance }),
      ...(this.config.tabindex !== undefined && { tabindex: this.config.tabindex }),
      ...(this.config.action !== undefined && { action: this.config.action }),
      ...(this.config.cData !== undefined && { cData: this.config.cData }),
      ...(this.config.retry !== undefined && { retry: this.config.retry }),
      ...(this.config.retryInterval !== undefined && {
        "retry-interval": this.config.retryInterval,
      }),
      ...(this.config.refreshExpired !== undefined && {
        "refresh-expired": this.config.refreshExpired,
      }),
      ...(this.config.refreshTimeout !== undefined && {
        "refresh-timeout": this.config.refreshTimeout,
      }),

      callback: (rawToken) => {
        const t: CaptchaToken = {
          value: rawToken,
          provider: "turnstile",
          issuedAt: Date.now(),
        };
        this.token = t;
        this.isExecuting = false;
        this.callbacks.onSuccess(t);
        this.resolveAll(t);
      },

      "error-callback": (code) => {
        const error = new CaptchaError(
          "provider-error",
          code !== undefined ? `Turnstile error: ${code}` : "Turnstile error",
          "turnstile",
        );
        this.isExecuting = false;
        this.callbacks.onError?.(error);
        this.rejectAll(error);
      },

      "expired-callback": () => {
        this.token = null;
        this.callbacks.onExpire?.();
        // Pending execute() promises are kept alive — managed widgets can be
        // re-solved. Callers can call reset() to cancel them explicitly.
      },

      // The challenge timed out before the user completed it. Treat it the
      // same as an expiry — clear state and let the caller decide whether
      // to reset and retry. The widget auto-refreshes by default.
      "timeout-callback": () => {
        this.token = null;
        this.isExecuting = false;
        this.callbacks.onExpire?.();
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

  execute(action?: string): Promise<CaptchaToken> {
    if (this.destroyed) {
      return Promise.reject(
        new CaptchaError("execute-failed", "Widget has been destroyed.", "turnstile"),
      );
    }

    // Token already available — return immediately.
    if (this.token) return Promise.resolve(this.token);

    return new Promise<CaptchaToken>((resolve, reject) => {
      this.pending.push({ resolve, reject });

      // Another execute() call is already in flight — just enqueue.
      if (this.isExecuting) return;

      this.ready
        .then(() => {
          if (this.destroyed || !this.widgetId) return;

          // Token may have arrived between execute() and ready resolving.
          if (this.token) {
            this.resolveAll(this.token);
            return;
          }

          // interactive mode: trigger the invisible challenge.
          // Guard against concurrent execute() calls that each queued a
          // ready.then() before isExecuting was set.
          if (this.config.execution === "execute" && !this.isExecuting) {
            this.isExecuting = true;
            window.turnstile?.execute(this.widgetId, action ? { action } : undefined);
          }
          // managed mode: wait for the automatic callback.
        })
        .catch((err: unknown) => {
          // Re-use the error if it already came from captigo (e.g. loadScript()).
          // onError is handled by the constructor catch — only reject pending promises here.
          const error =
            err instanceof CaptchaError
              ? err
              : new CaptchaError(
                  "script-load-failed",
                  err instanceof Error ? err.message : String(err),
                  "turnstile",
                );
          this.rejectAll(error);
        });
    });
  }

  reset(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    }
    this.token = null;
    this.isExecuting = false;
    this.rejectAll(new CaptchaError("execute-failed", "Widget was reset.", "turnstile"));
  }

  destroy(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.remove(this.widgetId);
      this.widgetId = null;
    }
    this.token = null;
    this.destroyed = true;
    this.isExecuting = false;
    this.rejectAll(new CaptchaError("execute-failed", "Widget was destroyed.", "turnstile"));
  }

  getToken(): CaptchaToken | null {
    return this.token;
  }
}
