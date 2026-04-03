import type { AdapterConfig, CaptchaAdapter, CaptchaToken } from "captigo";

// Re-export core types and the error class for single-import convenience.
// Note: CaptchaWidget (the widget handle interface) is intentionally not
// re-exported here to avoid a name clash with the Vue component below.
export { CaptchaError } from "captigo";
export type {
  AdapterConfig,
  AdapterMeta,
  CaptchaAdapter,
  CaptchaErrorCode,
  CaptchaMode,
  CaptchaToken,
  VerifyResult,
  WidgetCallbacks,
} from "captigo";

// ─── useCaptcha ───────────────────────────────────────────────────────────────

export interface UseCaptchaOptions {
  /** Called when a token expires. */
  onExpire?: () => void;
}

export interface UseCaptchaReturn {
  /** The most recently received token, or `null` if not yet solved or expired. */
  token: CaptchaToken | null;
  /** True while the provider script is loading. */
  isLoading: boolean;
  /** True if the widget is ready to accept an `execute()` call. */
  isReady: boolean;
  /**
   * Trigger the challenge. For interactive/passive modes, call this on submit.
   * For managed mode, resolves with the current token or waits for the next solve.
   */
  execute: (action?: string) => Promise<CaptchaToken>;
  /** Reset the widget to its initial state and clear the current token. */
  reset: () => void;
}

/**
 * Vue 3 composable for managing a CAPTCHA widget lifecycle.
 *
 * Pass a `Ref<HTMLElement | null>` for the container for managed/interactive
 * adapters. For passive adapters (`meta.requiresContainer === false`),
 * `containerRef` may be omitted.
 *
 * @example
 * ```ts
 * const containerRef = ref<HTMLDivElement | null>(null);
 * const { token, execute } = useCaptcha(adapter, containerRef);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCaptcha<TConfig extends AdapterConfig>(
  _adapter: CaptchaAdapter<TConfig>,
  _containerRef?: { readonly value: HTMLElement | null },
  _options?: UseCaptchaOptions,
): UseCaptchaReturn {
  // TODO: implement using onMounted/onUnmounted for widget lifecycle,
  //       ref() for token/isLoading/isReady
  throw new Error("@captigo/vue: useCaptcha is not yet implemented");
}

// ─── CaptchaWidget ────────────────────────────────────────────────────────────

export interface CaptchaWidgetProps<TConfig extends AdapterConfig> {
  adapter: CaptchaAdapter<TConfig>;
  onSuccess?: (token: CaptchaToken) => void;
  onError?: (error: unknown) => void;
  onExpire?: () => void;
  class?: string;
  style?: Record<string, string>;
}

/**
 * Vue 3 component that renders the appropriate CAPTCHA widget for the given
 * adapter and forwards lifecycle events.
 *
 * @example
 * ```vue
 * <CaptchaWidget :adapter="adapter" @success="onToken" />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CaptchaWidget<TConfig extends AdapterConfig>(
  _props: CaptchaWidgetProps<TConfig>,
): null {
  // TODO: implement as a defineComponent wrapping useCaptcha
  throw new Error("@captigo/vue: CaptchaWidget is not yet implemented");
}
