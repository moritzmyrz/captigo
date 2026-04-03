import type { AdapterConfig } from "@captigo/core";

/**
 * Configuration for the reCAPTCHA v2 adapter.
 *
 * - `"checkbox"` / `"compact"` — visible widget, fires automatically. `mode: "managed"`.
 * - `"invisible"` — hidden badge, requires `widget.execute()`. `mode: "interactive"`.
 */
export interface ReCaptchaV2Config extends AdapterConfig {
  /**
   * Widget variant.
   *
   * - `"checkbox"` (default) — standard checkbox widget.
   * - `"compact"` — smaller checkbox widget.
   * - `"invisible"` — no visible checkbox; call `widget.execute()` to trigger.
   */
  size?: "checkbox" | "compact" | "invisible";

  /** @default "light" */
  theme?: "light" | "dark";

  /**
   * Badge position for invisible v2. Only used when `size: "invisible"`.
   * @default "bottomright"
   */
  badge?: "bottomright" | "bottomleft" | "inline";

  /** Language override (e.g. `"en"`, `"de"`). */
  language?: string;

  /** Tab index for the widget iframe. */
  tabindex?: number;
}

/**
 * Configuration for the reCAPTCHA v3 adapter.
 *
 * v3 is score-based and entirely passive — no widget is shown to the user.
 * Call `widget.execute(action?)` to get a token and score.
 */
export interface ReCaptchaV3Config extends AdapterConfig {
  /**
   * Default action label for analytics in the reCAPTCHA admin console.
   * Can be overridden per `widget.execute(action)` call.
   * @default "default"
   */
  action?: string;
}
