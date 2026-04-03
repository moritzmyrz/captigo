/**
 * Type definitions for the Cloudflare Turnstile browser SDK.
 * @see https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
 */

export interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: (token?: string) => void;
  "timeout-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  language?: string;
  /** @default "normal" */
  size?: "normal" | "compact" | "flexible";
  /** @default "render" */
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  tabindex?: number;
  action?: string;
  cData?: string;
  retry?: "auto" | "never";
  "retry-interval"?: number;
  "refresh-expired"?: "auto" | "manual" | "never";
  "refresh-timeout"?: "auto" | "manual" | "never";
  "response-field"?: boolean;
  "response-field-name"?: string;
}

export interface TurnstileExecuteOptions {
  action?: string;
  cData?: string;
}

export interface TurnstileSDK {
  render(container: string | HTMLElement, options: TurnstileRenderOptions): string;
  execute(container: string | HTMLElement, options?: TurnstileExecuteOptions): void;
  reset(container: string | HTMLElement): void;
  remove(container: string | HTMLElement): void;
  getResponse(container: string | HTMLElement): string | undefined;
  isExpired(container: string | HTMLElement): boolean;
}

declare global {
  interface Window {
    turnstile?: TurnstileSDK;
  }
}
