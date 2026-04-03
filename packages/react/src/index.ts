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
 * Hook for managing a CAPTCHA widget lifecycle in a React component.
 *
 * @example
 * ```tsx
 * const { token, reset } = useCaptcha(provider);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCaptcha<TConfig extends CaptchaProviderConfig>(
  _provider: CaptchaProvider<TConfig>,
): UseCaptchaReturn {
  // TODO: implement
  throw new Error("@captigo/react: useCaptcha is not yet implemented");
}

// ─── CaptchaWidget ────────────────────────────────────────────────────────────

export interface CaptchaWidgetProps<TConfig extends CaptchaProviderConfig> {
  provider: CaptchaProvider<TConfig>;
  onSuccess?: (token: CaptchaToken) => void;
  onError?: (error: unknown) => void;
  onExpire?: () => void;
  className?: string;
}

/**
 * Drop-in React component that renders the appropriate CAPTCHA widget
 * for the given provider.
 *
 * @example
 * ```tsx
 * <CaptchaWidget provider={provider} onSuccess={(t) => setToken(t.value)} />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CaptchaWidget<TConfig extends CaptchaProviderConfig>(
  _props: CaptchaWidgetProps<TConfig>,
): null {
  // TODO: implement
  throw new Error("@captigo/react: CaptchaWidget is not yet implemented");
}
