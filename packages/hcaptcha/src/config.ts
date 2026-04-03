import type { AdapterConfig } from "@captigo/core";

/**
 * Configuration for the hCaptcha adapter.
 * All options except `siteKey` are optional.
 */
export interface HCaptchaConfig extends AdapterConfig {
  /**
   * Controls the widget style and execution model.
   *
   * - `"normal"` (default) — visible checkbox, fires automatically. `mode: "managed"`.
   * - `"compact"` — smaller visible checkbox, fires automatically. `mode: "managed"`.
   * - `"invisible"` — no visible element, requires `widget.execute()`. `mode: "interactive"`.
   */
  size?: "normal" | "compact" | "invisible";

  /**
   * Widget color scheme.
   * @default "light"
   */
  theme?: "light" | "dark";

  /** Language override (e.g. `"en"`, `"de"`). Defaults to browser language. */
  language?: string;

  /**
   * Custom hCaptcha endpoint for enterprise customers.
   * @default "https://hcaptcha.com"
   */
  endpoint?: string;

  /** Tab index for the widget iframe. */
  tabindex?: number;
}
