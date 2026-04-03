import { forwardRef, useImperativeHandle } from "react";
import type { CSSProperties } from "react";
import type { AdapterConfig, CaptchaAdapter, CaptchaError, CaptchaToken } from "captigo";
import { useCaptcha } from "./use-captcha.js";

// ─── Imperative handle ────────────────────────────────────────────────────────

/**
 * Ref handle exposed by `<Captcha>` for programmatic control.
 * Useful for invisible/interactive widgets where you call `execute()` on submit.
 *
 * @example
 * ```tsx
 * const captchaRef = useRef<CaptchaHandle>(null);
 *
 * <Captcha ref={captchaRef} adapter={adapter} onSuccess={setToken} />
 *
 * // On form submit:
 * const token = await captchaRef.current!.execute("checkout");
 * ```
 */
export interface CaptchaHandle {
  /**
   * Trigger the challenge. Resolves with the token when complete.
   * For managed widgets, returns the current token immediately if one exists.
   */
  execute: (action?: string) => Promise<CaptchaToken>;
  /** Reset the widget to its initial unsolved state. */
  reset: () => void;
  /** Returns the current token, or null if not solved or expired. */
  getToken: () => CaptchaToken | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CaptchaProps {
  /** The provider adapter created by a package like `@captigo/turnstile`. */
  adapter: CaptchaAdapter<AdapterConfig>;
  /** Called when the challenge completes and a token is available. */
  onSuccess?: (token: CaptchaToken) => void;
  /** Called when the widget encounters an unrecoverable error. */
  onError?: (error: CaptchaError) => void;
  /** Called when a token expires. */
  onExpire?: () => void;
  className?: string;
  style?: CSSProperties;
  /** HTML id for the container div. */
  id?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drop-in React component that mounts a provider-agnostic CAPTCHA widget.
 *
 * Works with any captigo adapter — pass the adapter from your provider package
 * (e.g. `@captigo/turnstile`) and this component handles the full React
 * lifecycle: mounting, unmounting, and cleanup.
 *
 * For programmatic control (invisible/interactive widgets), forward a ref to
 * access the `CaptchaHandle` API.
 *
 * @example Managed widget (visible, fires automatically)
 * ```tsx
 * <Captcha adapter={adapter} onSuccess={(t) => setToken(t.value)} />
 * ```
 *
 * @example Interactive/invisible widget with imperative execute
 * ```tsx
 * const captchaRef = useRef<CaptchaHandle>(null);
 *
 * <Captcha ref={captchaRef} adapter={adapter} onSuccess={setToken} />
 *
 * const handleSubmit = async () => {
 *   const token = await captchaRef.current!.execute("login");
 *   await submitForm(token.value);
 * };
 * ```
 */
export const Captcha = forwardRef<CaptchaHandle, CaptchaProps>(function Captcha(
  { adapter, onSuccess, onError, onExpire, ...divProps },
  ref,
) {
  const { containerRef, token, execute, reset } = useCaptcha(adapter, {
    ...(onSuccess !== undefined && { onSuccess }),
    ...(onError !== undefined && { onError }),
    ...(onExpire !== undefined && { onExpire }),
  });

  useImperativeHandle(
    ref,
    () => ({
      execute,
      reset,
      getToken: () => token,
    }),
    // getToken closes over `token` from state, so update the handle when it changes.
    [execute, reset, token],
  );

  return <div ref={containerRef} {...divProps} />;
});
