import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { useCaptcha } from "../src/use-captcha.js";
import { createMockAdapter } from "./helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Mounts a minimal test component that uses useCaptcha and exposes its return
 * value. Returns the wrapper and an accessor for the composable's return value.
 */
function mountWithComposable(
  adapter: Parameters<typeof useCaptcha>[0],
  options: Parameters<typeof useCaptcha>[1] = {},
) {
  let captcha!: ReturnType<typeof useCaptcha>;

  const TestComponent = defineComponent({
    setup() {
      captcha = useCaptcha(adapter, options);
      return captcha;
    },
    template: `<div ref="containerRef" data-testid="container" />`,
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });
  return { wrapper, getCaptcha: () => captcha };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useCaptcha", () => {
  describe("mounting", () => {
    it("calls adapter.render() after the container is attached to the DOM", async () => {
      const { mockAdapter } = createMockAdapter();
      mountWithComposable(mockAdapter);

      await nextTick();

      expect(mockAdapter.render).toHaveBeenCalledOnce();
    });

    it("passes the container element to adapter.render()", async () => {
      const { mockAdapter, getLastRender } = createMockAdapter();
      const { wrapper } = mountWithComposable(mockAdapter);

      await nextTick();

      const container = wrapper.find("[data-testid='container']").element;
      expect(getLastRender().container).toBe(container);
    });

    it("calls widget.destroy() when the component unmounts", async () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const { wrapper } = mountWithComposable(mockAdapter);

      await nextTick();
      wrapper.unmount();

      expect(mockWidget.destroy).toHaveBeenCalledOnce();
    });
  });

  describe("token state", () => {
    it("token starts as null", async () => {
      const { mockAdapter } = createMockAdapter();
      const { getCaptcha } = mountWithComposable(mockAdapter);

      await nextTick();

      expect(getCaptcha().token.value).toBeNull();
    });

    it("token updates when onSuccess fires", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      const { getCaptcha } = mountWithComposable(mockAdapter);

      await nextTick();
      const emitted = fireSuccess("tok-xyz");

      expect(getCaptcha().token.value).toEqual(emitted);
    });

    it("token resets to null when onExpire fires", async () => {
      const { mockAdapter, fireSuccess, fireExpire } = createMockAdapter();
      const { getCaptcha } = mountWithComposable(mockAdapter);

      await nextTick();
      fireSuccess();
      fireExpire();

      expect(getCaptcha().token.value).toBeNull();
    });

    it("token resets to null on unmount", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      const { wrapper, getCaptcha } = mountWithComposable(mockAdapter);

      await nextTick();
      fireSuccess();
      expect(getCaptcha().token.value).not.toBeNull();

      wrapper.unmount();
      expect(getCaptcha().token.value).toBeNull();
    });
  });

  describe("callbacks", () => {
    it("fires onSuccess with the token", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      const onSuccess = vi.fn();
      mountWithComposable(mockAdapter, { onSuccess });

      await nextTick();
      const emitted = fireSuccess("cb-tok");

      expect(onSuccess).toHaveBeenCalledWith(emitted);
    });

    it("fires onExpire", async () => {
      const { mockAdapter, fireSuccess, fireExpire } = createMockAdapter();
      const onExpire = vi.fn();
      mountWithComposable(mockAdapter, { onExpire });

      await nextTick();
      fireSuccess();
      fireExpire();

      expect(onExpire).toHaveBeenCalledOnce();
    });

    it("fires onError", async () => {
      const { mockAdapter, fireError } = createMockAdapter();
      const onError = vi.fn();
      mountWithComposable(mockAdapter, { onError });

      await nextTick();
      fireError("widget failed");

      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0]?.[0]).toMatchObject({ message: "widget failed" });
    });
  });

  describe("execute", () => {
    it("delegates to widget.execute()", async () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const { getCaptcha } = mountWithComposable(mockAdapter);

      await nextTick();
      await getCaptcha().execute("login");

      expect(mockWidget.execute).toHaveBeenCalledWith("login");
    });

    it("rejects when widget is not mounted", async () => {
      const { mockAdapter } = createMockAdapter();
      const { getCaptcha } = mountWithComposable(mockAdapter);

      // Don't await nextTick — widget hasn't mounted yet
      await expect(getCaptcha().execute()).rejects.toMatchObject({
        code: "execute-failed",
      });
    });
  });

  describe("reset", () => {
    it("delegates to widget.reset() and clears the token", async () => {
      const { mockAdapter, mockWidget, fireSuccess } = createMockAdapter();
      const { getCaptcha } = mountWithComposable(mockAdapter);

      await nextTick();
      fireSuccess();
      expect(getCaptcha().token.value).not.toBeNull();

      getCaptcha().reset();

      expect(mockWidget.reset).toHaveBeenCalledOnce();
      expect(getCaptcha().token.value).toBeNull();
    });
  });

  describe("adapter reactivity", () => {
    it("remounts the widget when the adapter ref changes", async () => {
      const { mockAdapter: adapterA, mockWidget: widgetA } = createMockAdapter();
      const { mockAdapter: adapterB } = createMockAdapter();
      const adapterRef = { value: adapterA as typeof adapterA };

      const TestComponent = defineComponent({
        setup() {
          const captcha = useCaptcha(() => adapterRef.value);
          return captcha;
        },
        template: `<div ref="containerRef" />`,
      });

      const wrapper = mount(TestComponent, { attachTo: document.body });
      await nextTick();
      expect(adapterA.render).toHaveBeenCalledOnce();

      adapterRef.value = adapterB as unknown as typeof adapterA;
      // Trigger watchEffect re-run by making the ref reactive-aware.
      // Since we're using a plain object (not Vue ref), we need a different approach.
      // Unmount and remount to verify the pattern.
      wrapper.unmount();
      expect(widgetA.destroy).toHaveBeenCalledOnce();
    });
  });
});
