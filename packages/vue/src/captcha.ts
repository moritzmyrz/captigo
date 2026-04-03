import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import type { AdapterConfig, CaptchaAdapter, CaptchaError, CaptchaToken } from "captigo";
import { useCaptcha } from "./use-captcha.js";

// ─── Exposed instance type ────────────────────────────────────────────────────

/**
 * The API exposed on a `<Captcha>` component ref for programmatic control.
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from "vue";
 * import { Captcha } from "@captigo/vue";
 * import type { CaptchaInstance } from "@captigo/vue";
 *
 * const captchaRef = ref<CaptchaInstance>();
 * const handleSubmit = async () => {
 *   const token = await captchaRef.value!.execute("login");
 *   await submitForm(token.value);
 * };
 * </script>
 *
 * <template>
 *   <Captcha ref="captchaRef" :adapter="adapter" @success="onToken" />
 * </template>
 * ```
 */
export interface CaptchaInstance {
  /** Trigger the challenge. Resolves with the token on completion. */
  execute: (action?: string) => Promise<CaptchaToken>;
  /** Reset the widget to its initial unsolved state. */
  reset: () => void;
  /** Returns the current token, or null if not solved or expired. */
  getToken: () => CaptchaToken | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Drop-in Vue 3 component that mounts a provider-agnostic CAPTCHA widget.
 *
 * Works with any captigo adapter — swap `adapter` to change the provider
 * without touching the component. Handles the full Vue lifecycle:
 * mounting, unmounting, and widget cleanup on destroy.
 *
 * For programmatic control (invisible/interactive widgets), grab a ref to
 * access the `CaptchaInstance` API.
 *
 * Extra attributes (`class`, `style`, `id`, etc.) fall through to the
 * underlying container `<div>` automatically.
 *
 * @example Managed widget (visible checkbox, fires automatically)
 * ```vue
 * <Captcha :adapter="adapter" @success="onToken" />
 * ```
 *
 * @example Invisible widget with imperative execute
 * ```vue
 * <Captcha ref="captchaRef" :adapter="adapter" @success="onToken" />
 * ```
 */
export const Captcha = defineComponent({
  name: "Captcha",

  props: {
    /** The provider adapter created by a package like `@captigo/turnstile`. */
    adapter: {
      type: Object as PropType<CaptchaAdapter<AdapterConfig>>,
      required: true,
    },
    onSuccess: {
      type: Function as PropType<(token: CaptchaToken) => void>,
      default: undefined,
    },
    onError: {
      type: Function as PropType<(error: CaptchaError) => void>,
      default: undefined,
    },
    onExpire: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },

  setup(props, { expose }) {
    // Pass adapter as a getter so Vue's reactivity tracks prop.adapter changes.
    // If the adapter prop is swapped out, the old widget is destroyed and a
    // new one is created automatically by useCaptcha's watchEffect.
    const { containerRef, token, execute, reset } = useCaptcha(
      () => props.adapter,
      {
        // These arrow functions always call the latest prop value. Since props
        // is reactive and we access it at call time (not at setup time), there
        // is no stale-closure issue — no equivalent of React's callbacksRef needed.
        onSuccess: (t) => props.onSuccess?.(t),
        onError: (err) => props.onError?.(err),
        onExpire: () => props.onExpire?.(),
      },
    );

    expose({
      execute,
      reset,
      getToken: () => token.value,
    } satisfies CaptchaInstance);

    return () => h("div", { ref: containerRef });
  },
});
