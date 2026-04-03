import type { CaptchaProvider, CaptchaProviderConfig, CaptchaToken } from "captigo";

// Re-export core types so consumers only need one import.
export type {
  CaptchaCallbacks,
  CaptchaProvider,
  CaptchaProviderConfig,
  CaptchaToken,
  CaptchaVerifyResult,
} from "captigo";

// ─── useCaptcha ───────────────────────────────────────────────────────────────

export interface UseCaptchaReturn {
  /** The most recently received token, or null if not yet solved or expired. */
  token: CaptchaToken | null;
  /** True while the widget script is loading. */
  isLoading: boolean;
  /** Reset the widget back to its initial state. */
  reset: () => void;
}

/**
 * Vue 3 composable for managing a CAPTCHA widget lifecycle.
 *
 * @example
 * ```ts
 * const { token, reset } = useCaptcha(provider);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCaptcha<TConfig extends CaptchaProviderConfig>(
  _provider: CaptchaProvider<TConfig>,
): UseCaptchaReturn {
  // TODO: implement using Vue refs and lifecycle hooks
  throw new Error("@captigo/vue: useCaptcha is not yet implemented");
}

// ─── CaptchaWidget ────────────────────────────────────────────────────────────

export interface CaptchaWidgetProps<TConfig extends CaptchaProviderConfig> {
  provider: CaptchaProvider<TConfig>;
  onSuccess?: (token: CaptchaToken) => void;
  onError?: (error: unknown) => void;
  onExpire?: () => void;
}

/**
 * Vue 3 component that renders the appropriate CAPTCHA widget for the given provider.
 * Register it globally or use it directly in SFCs.
 *
 * @example
 * ```vue
 * <CaptchaWidget :provider="provider" @success="onToken" />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CaptchaWidget<TConfig extends CaptchaProviderConfig>(
  _props: CaptchaWidgetProps<TConfig>,
): null {
  // TODO: implement as a Vue functional component
  throw new Error("@captigo/vue: CaptchaWidget is not yet implemented");
}
