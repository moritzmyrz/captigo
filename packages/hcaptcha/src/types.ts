/**
 * Type definitions for the hCaptcha browser SDK.
 * @see https://docs.hcaptcha.com/configuration
 */

export interface HCaptchaRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  /** Called when a completed token expires (token lifetime: ~2 min). */
  "expired-callback"?: () => void;
  /** Called when an invisible challenge expires before the user completes it. */
  "chalexpired-callback"?: () => void;
  "error-callback"?: (errCode: string) => void;
  /** Called when the challenge overlay opens. */
  "open-callback"?: () => void;
  /** Called when the challenge overlay closes without solving. */
  "close-callback"?: () => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact" | "invisible";
  tabindex?: number;
  languageoverride?: string;
  endpoint?: string;
}

export interface HCaptchaSDK {
  render(container: string | HTMLElement, options: HCaptchaRenderOptions): string;
  /** Trigger the invisible challenge (fires `callback` when solved). */
  execute(widgetId: string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
  getResponse(widgetId?: string): string;
}

// Global Window augmentation is in globals.d.ts.
