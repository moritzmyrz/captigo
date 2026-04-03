import type { AdapterConfig } from "captigo";

/**
 * Configuration for the Cloudflare Turnstile adapter.
 * All options except `siteKey` are optional.
 */
export interface TurnstileConfig extends AdapterConfig {
  /**
   * Controls when the challenge fires.
   *
   * - `"render"` (default) — widget is visible and fires automatically on
   *   interaction. The adapter's mode will be `"managed"`.
   * - `"execute"` — invisible widget that waits for an explicit
   *   `widget.execute()` call. The adapter's mode will be `"interactive"`.
   */
  execution?: "render" | "execute";

  /**
   * Widget appearance theme.
   * @default "auto"
   */
  theme?: "light" | "dark" | "auto";

  /**
   * Widget display size.
   * @default "normal"
   */
  size?: "normal" | "compact" | "flexible";

  /**
   * Widget language override (e.g. `"en"`, `"de"`).
   * Defaults to the visitor's browser language.
   */
  language?: string;

  /**
   * Controls when the widget UI is shown.
   * @default "always"
   */
  appearance?: "always" | "execute" | "interaction-only";

  /** Tab index for the widget iframe. */
  tabindex?: number;

  /**
   * Action label visible in the Turnstile analytics dashboard
   * (e.g. `"login"`, `"checkout"`). Max 32 characters.
   */
  action?: string;

  /** Arbitrary customer data attached to the challenge. Max 255 bytes. */
  cData?: string;

  /**
   * Retry behavior after a failed challenge.
   * @default "auto"
   */
  retry?: "auto" | "never";

  /**
   * Milliseconds between automatic retries when `retry` is `"auto"`.
   * @default 8000
   */
  retryInterval?: number;

  /**
   * Token refresh policy when a token expires.
   * @default "auto"
   */
  refreshExpired?: "auto" | "manual" | "never";

  /**
   * Behavior when the challenge times out.
   * @default "auto"
   */
  refreshTimeout?: "auto" | "manual" | "never";
}
