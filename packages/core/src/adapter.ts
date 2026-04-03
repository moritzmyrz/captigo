import type { CaptchaError } from "./errors.js";
import type { AdapterConfig, AdapterMeta, CaptchaToken, VerifyOptions, VerifyResult } from "./types.js";

// ─── Widget callbacks ─────────────────────────────────────────────────────────

export interface WidgetCallbacks {
  /** Called when a challenge completes and a verified token is available. */
  onSuccess: (token: CaptchaToken) => void;
  /**
   * Called when the widget encounters an unrecoverable error.
   * The widget should be considered unusable until `reset()` is called.
   */
  onError?: (error: CaptchaError) => void;
  /**
   * Called when an existing token expires.
   * For `managed` widgets, the user will need to solve the challenge again.
   * For `interactive`/`passive` widgets, call `reset()` before `execute()`.
   */
  onExpire?: () => void;
}

// ─── Render options ───────────────────────────────────────────────────────────

/**
 * Options passed to `adapter.render()`. The adapter uses its own stored config
 * when mounting the widget — only callbacks are required here.
 * Additional rendering options may be added in future minor versions.
 */
export interface RenderOptions {
  callbacks: WidgetCallbacks;
}

// ─── Widget lifecycle ─────────────────────────────────────────────────────────

/**
 * A handle to a mounted CAPTCHA widget instance.
 *
 * Obtained by calling `adapter.render(container, options)`. Hold a reference
 * for the lifetime of the widget and call `destroy()` on cleanup.
 */
export interface CaptchaWidget {
  /**
   * Trigger the CAPTCHA challenge.
   *
   * - `"managed"` — Returns the current token if one exists, otherwise
   *   waits for the next `onSuccess`. The user drives the interaction.
   *   Calling `execute()` is optional in managed mode.
   * - `"interactive"` — Triggers the invisible challenge. Resolves when the
   *   user completes it (may briefly show a UI overlay).
   * - `"passive"` — Fires the score-based check immediately and resolves
   *   with a token. No user interaction occurs.
   *
   * @param action - Optional action label for auditing (e.g. `"login"`,
   *   `"checkout"`). Supported by interactive/passive providers.
   */
  execute(action?: string): Promise<CaptchaToken>;

  /**
   * Reset the widget to its initial unsolved state and clear any stored token.
   * Required before calling `execute()` again after a token has expired.
   */
  reset(): void;

  /**
   * Remove the widget from the DOM and release all resources (event listeners,
   * provider handles, etc.). Should be called on component unmount.
   * After calling `destroy()`, do not call any other method on this instance.
   */
  destroy(): void;

  /**
   * Returns the current token if one exists and has not expired, otherwise `null`.
   * Prefer using the `onSuccess` callback for reactive flows.
   */
  getToken(): CaptchaToken | null;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

/**
 * The contract every captigo provider adapter must implement.
 *
 * An adapter is a **configured, stateless** factory object. It knows your site
 * key and any provider-specific options, but holds no widget state itself.
 *
 * - Call `render()` to produce a stateful `CaptchaWidget` instance (client-side).
 * - Call `verify()` to validate a token against the provider's API (server-side).
 *
 * @example
 * ```ts
 * import { turnstile } from "@captigo/turnstile";
 *
 * const adapter = turnstile({ siteKey: "0x..." });
 *
 * // Client — mount the widget
 * const widget = adapter.render(container, { callbacks });
 * const token = await widget.execute();
 *
 * // Server — verify the submitted token
 * const result = await adapter.verify(token.value, process.env.TURNSTILE_SECRET);
 * if (!result.success) throw new Error("CAPTCHA failed");
 * ```
 */
export interface CaptchaAdapter<TConfig extends AdapterConfig = AdapterConfig> {
  readonly meta: AdapterMeta;

  /** The configuration this adapter was created with. */
  readonly config: TConfig;

  /**
   * Mount the CAPTCHA widget into `container` and return a widget handle.
   *
   * The adapter is responsible for lazy-loading any required provider scripts.
   * For `passive` adapters, `container` may be ignored — check
   * `meta.requiresContainer` before providing a real element.
   */
  render(container: HTMLElement, options: RenderOptions): CaptchaWidget;

  /**
   * Verify a client-submitted token against the provider's server-side API.
   *
   * Should only be called from a **server** environment. Never expose your
   * secret key to the browser.
   */
  verify(token: string, secretKey: string, options?: VerifyOptions): Promise<VerifyResult>;
}

/**
 * A function that accepts provider config and returns a configured
 * `CaptchaAdapter`. This is the typical default export shape of a provider
 * package (e.g. `turnstile(config)`, `hcaptcha(config)`).
 */
export type AdapterFactory<TConfig extends AdapterConfig = AdapterConfig> = (
  config: TConfig,
) => CaptchaAdapter<TConfig>;
