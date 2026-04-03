import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { Captcha } from "../src/captcha.js";
import { createMockAdapter } from "./helpers.js";

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Captcha component", () => {
  describe("rendering", () => {
    it("renders a div container", async () => {
      const { mockAdapter } = createMockAdapter();
      const wrapper = mount(Captcha, {
        props: { adapter: mockAdapter },
        attachTo: document.body,
      });

      await nextTick();

      expect(wrapper.element.tagName).toBe("DIV");
    });

    it("calls adapter.render() on mount", async () => {
      const { mockAdapter } = createMockAdapter();
      mount(Captcha, {
        props: { adapter: mockAdapter },
        attachTo: document.body,
      });

      await nextTick();

      expect(mockAdapter.render).toHaveBeenCalledOnce();
    });

    it("calls widget.destroy() on unmount", async () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const wrapper = mount(Captcha, {
        props: { adapter: mockAdapter },
        attachTo: document.body,
      });

      await nextTick();
      wrapper.unmount();

      expect(mockWidget.destroy).toHaveBeenCalledOnce();
    });

    it("passes extra attributes through to the container div", async () => {
      const { mockAdapter } = createMockAdapter();
      const wrapper = mount(Captcha, {
        props: { adapter: mockAdapter },
        attrs: { id: "my-captcha", class: "widget-container" },
        attachTo: document.body,
      });

      await nextTick();

      expect(wrapper.attributes("id")).toBe("my-captcha");
      expect(wrapper.attributes("class")).toContain("widget-container");
    });
  });

  describe("callbacks", () => {
    it("fires onSuccess with the emitted token", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      const onSuccess = vi.fn();
      mount(Captcha, {
        props: { adapter: mockAdapter, onSuccess },
        attachTo: document.body,
      });

      await nextTick();
      const token = fireSuccess("token-abc");

      expect(onSuccess).toHaveBeenCalledWith(token);
    });

    it("fires onExpire", async () => {
      const { mockAdapter, fireSuccess, fireExpire } = createMockAdapter();
      const onExpire = vi.fn();
      mount(Captcha, {
        props: { adapter: mockAdapter, onExpire },
        attachTo: document.body,
      });

      await nextTick();
      fireSuccess();
      fireExpire();

      expect(onExpire).toHaveBeenCalledOnce();
    });

    it("fires onError", async () => {
      const { mockAdapter, fireError } = createMockAdapter();
      const onError = vi.fn();
      mount(Captcha, {
        props: { adapter: mockAdapter, onError },
        attachTo: document.body,
      });

      await nextTick();
      fireError("network error");

      expect(onError).toHaveBeenCalledOnce();
    });

    it("remounts the widget when the adapter prop changes", async () => {
      const { mockAdapter: adapterA, mockWidget: widgetA } = createMockAdapter();
      const { mockAdapter: adapterB } = createMockAdapter();

      const wrapper = mount(Captcha, {
        props: { adapter: adapterA },
        attachTo: document.body,
      });

      await nextTick();
      expect(adapterA.render).toHaveBeenCalledOnce();

      await wrapper.setProps({ adapter: adapterB });
      await nextTick();

      expect(widgetA.destroy).toHaveBeenCalledOnce();
      expect(adapterB.render).toHaveBeenCalledOnce();
    });
  });

  describe("expose / CaptchaInstance", () => {
    // In Vue Test Utils, wrapper.vm returns the component's exposed interface,
    // which is exactly what expose() declares in the setup function.

    it("exposes execute() which delegates to the widget", async () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const wrapper = mount(Captcha, {
        props: { adapter: mockAdapter },
        attachTo: document.body,
      });

      await nextTick();
      await wrapper.vm.execute("checkout");

      expect(mockWidget.execute).toHaveBeenCalledWith("checkout");
    });

    it("exposes reset() which delegates to the widget", async () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const wrapper = mount(Captcha, {
        props: { adapter: mockAdapter },
        attachTo: document.body,
      });

      await nextTick();
      wrapper.vm.reset();

      expect(mockWidget.reset).toHaveBeenCalledOnce();
    });

    it("exposes getToken() which returns the current token", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      const wrapper = mount(Captcha, {
        props: { adapter: mockAdapter },
        attachTo: document.body,
      });

      await nextTick();
      expect(wrapper.vm.getToken()).toBeNull();

      fireSuccess("tok-exposed");
      expect(wrapper.vm.getToken()?.value).toBe("tok-exposed");
    });
  });
});
