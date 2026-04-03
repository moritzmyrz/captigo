import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { CaptchaError } from "captigo";
import type { AdapterConfig, CaptchaAdapter, CaptchaToken, CaptchaWidget } from "captigo";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseCaptchaOptions {
  /** Called when the widget produces a token. */
  onSuccess?: (token: CaptchaToken) => void;
  /** Called when the widget encounters an unrecoverable error. */
  onError?: (error: CaptchaError) => void;
  /** Called when an existing token expires. */
  onExpire?: () => void;
}

export interface UseCaptchaReturn {
  /**
   * Attach this ref to the container `<div>` where the widget should render.
   *
   * ```tsx
   * const { containerRef } = useCaptcha(adapter);
   * return <div ref={containerRef} />;
   * ```
   */
  containerRef: RefObject<HTMLDivElement | null>;

  /**
   * The current token, or `null` if not yet solved or expired.
   * Triggers a re-render when the token changes.
   */
  token: CaptchaToken | null;

  /**
   * Trigger the challenge and return a Promise that resolves with the token.
   *
   * - Managed widgets: resolves immediately if a token already exists,
   *   otherwise waits for the user to complete the challenge.
   * - Interactive widgets: triggers the invisible challenge, resolves on solve.
   */
  execute: (action?: string) => Promise<CaptchaToken>;

  /** Reset the widget to its initial unsolved state and clear the token. */
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manage a CAPTCHA widget lifecycle inside a React component.
 *
 * The hook creates and destroys the widget in sync with the component's mount
 * lifecycle. When `adapter` changes (by reference), the old widget is
 * destroyed and a new one is created.
 *
 * Callbacks (`onSuccess`, `onError`, `onExpire`) are kept stable internally
 * so passing inline functions does not trigger widget remounts.
 *
 * **Important:** Create your adapter outside the component (or with `useMemo`)
 * to prevent unnecessary widget remounts on every render.
 *
 * @example
 * ```tsx
 * const { containerRef, token, execute } = useCaptcha(adapter, {
 *   onSuccess: (t) => setToken(t.value),
 * });
 *
 * return (
 *   <>
 *     <div ref={containerRef} />
 *     <button onClick={() => execute("login")}>Submit</button>
 *   </>
 * );
 * ```
 */
export function useCaptcha<TConfig extends AdapterConfig = AdapterConfig>(
  adapter: CaptchaAdapter<TConfig>,
  options: UseCaptchaOptions = {},
): UseCaptchaReturn {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<CaptchaWidget | null>(null);
  const [token, setToken] = useState<CaptchaToken | null>(null);

  // Store callbacks in a ref so their identity changes don't cause the widget
  // to be destroyed and recreated. The widget always calls the latest version.
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const widget = adapter.render(container, {
      callbacks: {
        onSuccess: (t) => {
          setToken(t);
          callbacksRef.current.onSuccess?.(t);
        },
        onError: (err) => {
          callbacksRef.current.onError?.(err);
        },
        onExpire: () => {
          setToken(null);
          callbacksRef.current.onExpire?.();
        },
      },
    });

    widgetRef.current = widget;

    return () => {
      widget.destroy();
      widgetRef.current = null;
      setToken(null);
    };
  }, [adapter]);

  const execute = useCallback((action?: string): Promise<CaptchaToken> => {
    const widget = widgetRef.current;
    if (!widget) {
      return Promise.reject(
        new CaptchaError(
          "execute-failed",
          "@captigo/react: widget is not mounted. Make sure the container ref is attached to a DOM element.",
          "captigo",
        ),
      );
    }
    return widget.execute(action);
  }, []);

  const reset = useCallback(() => {
    widgetRef.current?.reset();
    setToken(null);
  }, []);

  return { containerRef, token, execute, reset };
}
