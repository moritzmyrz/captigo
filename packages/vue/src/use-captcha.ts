import { CaptchaError } from "@captigo/core";
import type { AdapterConfig, CaptchaAdapter, CaptchaToken, CaptchaWidget } from "@captigo/core";
import { ref, shallowRef, toValue, watchEffect } from "vue";
import type { MaybeRefOrGetter, Ref } from "vue";

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
   * Attach this ref to the container element where the widget should render.
   *
   * ```vue
   * <template>
   *   <div :ref="containerRef" />
   * </template>
   * ```
   */
  containerRef: Ref<HTMLDivElement | null>;

  /**
   * The current token, or `null` if not yet solved or expired.
   * Reactive — use in a template or `computed` for automatic updates.
   */
  token: Ref<CaptchaToken | null>;

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

// ─── Composable ───────────────────────────────────────────────────────────────

/**
 * Manage a CAPTCHA widget lifecycle inside a Vue 3 component.
 *
 * `adapter` can be a plain value, a `Ref`, or a getter function — any change
 * to the adapter will destroy the old widget and mount a fresh one.
 *
 * The `watchEffect` inside tracks `containerRef` and `adapter` as reactive
 * dependencies. The widget is mounted as soon as both are non-null, and is
 * destroyed when either changes or the component unmounts.
 *
 * **Important:** Construct your adapter outside the component (or in a
 * `computed`) to avoid unnecessary widget remounts on every reactive update.
 *
 * @example
 * ```ts
 * const adapter = turnstile({ siteKey: "0x..." });
 * const { containerRef, token, execute } = useCaptcha(adapter, {
 *   onSuccess: (t) => (token.value = t.value),
 * });
 * ```
 */
export function useCaptcha<TConfig extends AdapterConfig = AdapterConfig>(
  adapter: MaybeRefOrGetter<CaptchaAdapter<TConfig>>,
  options: UseCaptchaOptions = {},
): UseCaptchaReturn {
  const containerRef = ref<HTMLDivElement | null>(null);
  // shallowRef avoids deep reactive wrapping of the widget object.
  const widgetRef = shallowRef<CaptchaWidget | null>(null);
  const token = ref<CaptchaToken | null>(null);

  watchEffect((onCleanup) => {
    const resolvedAdapter = toValue(adapter);
    const container = containerRef.value;

    // Container isn't in the DOM yet (before mount). watchEffect will
    // re-run automatically once containerRef.value becomes non-null.
    if (!container) return;

    const widget = resolvedAdapter.render(container, {
      callbacks: {
        onSuccess: (t) => {
          token.value = t;
          options.onSuccess?.(t);
        },
        onError: (err) => {
          options.onError?.(err);
        },
        onExpire: () => {
          token.value = null;
          options.onExpire?.();
        },
      },
    });

    widgetRef.value = widget;

    onCleanup(() => {
      widget.destroy();
      widgetRef.value = null;
      token.value = null;
    });
  });

  const execute = (action?: string): Promise<CaptchaToken> => {
    const widget = widgetRef.value;
    if (!widget) {
      return Promise.reject(
        new CaptchaError(
          "execute-failed",
          "@captigo/vue: widget is not mounted. Make sure containerRef is attached to a DOM element.",
          "@captigo/core",
        ),
      );
    }
    return widget.execute(action);
  };

  const reset = () => {
    widgetRef.value?.reset();
    token.value = null;
  };

  return { containerRef, token, execute, reset };
}
