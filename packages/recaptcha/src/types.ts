/**
 * Type definitions for the Google reCAPTCHA browser SDK.
 * @see https://developers.google.com/recaptcha/docs/display
 * @see https://developers.google.com/recaptcha/docs/v3
 */

// ─── v2 ───────────────────────────────────────────────────────────────────────

export interface GrecaptchaV2RenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark";
  /** "normal" is the checkbox, "compact" is smaller, "invisible" hides the widget. */
  size?: "normal" | "compact" | "invisible";
  tabindex?: number;
  /** Badge position for invisible v2. */
  badge?: "bottomright" | "bottomleft" | "inline";
  hl?: string;
}

// ─── Global SDK interface ─────────────────────────────────────────────────────

/**
 * The `grecaptcha` global object supports both v2 widget methods and v3's
 * `execute(siteKey, { action })`. The `execute` method is overloaded:
 * - v2 invisible: `execute(widgetId: number): void`
 * - v3: `execute(siteKey: string, options: { action: string }): Promise<string>`
 */
export interface Grecaptcha {
  render(container: string | HTMLElement, options: GrecaptchaV2RenderOptions): number;
  execute(widgetId: number): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
  reset(widgetId?: number): void;
  getResponse(widgetId?: number): string;
  ready(callback: () => void): void;
}

// Global Window augmentation is in globals.d.ts.
