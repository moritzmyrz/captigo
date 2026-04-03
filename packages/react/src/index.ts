import type { AdapterConfig, CaptchaAdapter, CaptchaToken } from "captigo";

// Re-export the types consumers are most likely to need from a single import.
export type {
  AdapterConfig,
  AdapterMeta,
  CaptchaAdapter,
  CaptchaError,
  CaptchaMode,
  CaptchaToken,
  CaptchaWidget,
  VerifyResult,
  WidgetCallbacks,
} from "captigo";

// ─── useCaptcha ───────────────────────────────────────────────────────────────

export interface UseCaptchaOptions {
  /**
   * Called when a token expires. In managed mode this triggers automatically;
   * in interactive/passive mode you'll typically want to call `reset()`.
   */
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
   * For managed mode, this resolves immediately with the current token if one
   * exists, or waits for the next solve.
   */
  execute: (action?: string) => Promise<CaptchaToken>;
  /** Reset the widget to its initial state and clear the current token. */
  reset: () => void;
}

/**
 * Hook for managing a CAPTCHA widget inside a React component.
 *
 * Provide a `ref` to the container element for managed/interactive adapters.
 * For passive adapters, `containerRef` may be omitted.
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { token, execute, isReady } = useCaptcha(adapter, containerRef);
 *
 * return (
 *   <>
 *     <div ref={containerRef} />
 *     <button onClick={() => execute()}>Submit</button>
 *   </>
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCaptcha<TConfig extends AdapterConfig>(
  _adapter: CaptchaAdapter<TConfig>,
  _containerRef?: { readonly current: HTMLElement | null },
  _options?: UseCaptchaOptions,
): UseCaptchaReturn {
  // TODO: implement using useEffect for render/destroy lifecycle,
  //       useState for token/isLoading/isReady, useCallback for execute/reset
  throw new Error("@captigo/react: useCaptcha is not yet implemented");
}

// ─── CaptchaWidget ────────────────────────────────────────────────────────────

export interface CaptchaWidgetProps<TConfig extends AdapterConfig> {
  adapter: CaptchaAdapter<TConfig>;
  onSuccess?: (token: CaptchaToken) => void;
  onError?: (error: unknown) => void;
  onExpire?: () => void;
  className?: string;
  style?: Record<string, string>;
}

/**
 * Drop-in component that renders the appropriate CAPTCHA widget for the given
 * adapter and forwards lifecycle events via props.
 *
 * For interactive/passive adapters, expose a `ref` on the component to access
 * `execute()` imperatively (full ref API coming in implementation).
 *
 * @example
 * ```tsx
 * <CaptchaWidget
 *   adapter={adapter}
 *   onSuccess={(t) => setToken(t.value)}
 * />
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CaptchaWidget<TConfig extends AdapterConfig>(
  _props: CaptchaWidgetProps<TConfig>,
): null {
  // TODO: implement as a wrapper around useCaptcha
  throw new Error("@captigo/react: CaptchaWidget is not yet implemented");
}
