import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaptchaError } from "captigo";
import type { HCaptchaRenderOptions } from "../src/types.js";
import { HCaptchaWidget } from "../src/widget.js";

vi.mock("../src/script.js", () => ({ loadScript: vi.fn().mockResolvedValue(undefined) }));

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

type CapturedOpts = HCaptchaRenderOptions & {
  callback: NonNullable<HCaptchaRenderOptions["callback"]>;
  "expired-callback": NonNullable<HCaptchaRenderOptions["expired-callback"]>;
  "chalexpired-callback": NonNullable<HCaptchaRenderOptions["chalexpired-callback"]>;
  "error-callback": NonNullable<HCaptchaRenderOptions["error-callback"]>;
};

let capturedOpts: CapturedOpts;
const mockSdk = {
  render: vi.fn((_: HTMLElement, opts: HCaptchaRenderOptions) => {
    capturedOpts = opts as CapturedOpts;
    return "widget-h-001";
  }),
  execute: vi.fn(),
  reset: vi.fn(),
  remove: vi.fn(),
  getResponse: vi.fn(),
};

beforeEach(() => { vi.stubGlobal("hcaptcha", mockSdk); });
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("HCaptchaWidget", () => {
  describe("mount", () => {
    it("calls hcaptcha.render with sitekey and options", async () => {
      const c = document.createElement("div");
      new HCaptchaWidget(c, { siteKey: "sk", theme: "dark", size: "compact" }, { onSuccess: vi.fn() });
      await flush();
      expect(mockSdk.render).toHaveBeenCalledWith(c, expect.objectContaining({ sitekey: "sk", theme: "dark", size: "compact" }));
    });
  });

  describe("execute() — managed (normal)", () => {
    it("resolves when callback fires", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      const promise = widget.execute();
      capturedOpts.callback("tok-h");
      await expect(promise).resolves.toMatchObject({ value: "tok-h", provider: "hcaptcha" });
    });

    it("resolves immediately if token already exists", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      capturedOpts.callback("cached");
      await expect(widget.execute()).resolves.toMatchObject({ value: "cached" });
      expect(mockSdk.execute).not.toHaveBeenCalled();
    });

    it("does not call hcaptcha.execute() in managed mode", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      widget.execute();
      await flush();
      expect(mockSdk.execute).not.toHaveBeenCalled();
    });
  });

  describe("execute() — invisible", () => {
    it("calls hcaptcha.execute() to trigger the challenge", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k", size: "invisible" }, { onSuccess: vi.fn() });
      await flush();
      widget.execute();
      await flush();
      expect(mockSdk.execute).toHaveBeenCalledWith("widget-h-001");
    });

    it("does not call hcaptcha.execute() twice for concurrent calls", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k", size: "invisible" }, { onSuccess: vi.fn() });
      await flush();
      widget.execute();
      widget.execute();
      await flush();
      expect(mockSdk.execute).toHaveBeenCalledTimes(1);
    });

    it("rejects pending calls when chalexpired-callback fires", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k", size: "invisible" }, { onSuccess: vi.fn() });
      await flush();
      const promise = widget.execute();
      await flush();
      capturedOpts["chalexpired-callback"]();
      await expect(promise).rejects.toBeInstanceOf(CaptchaError);
    });
  });

  describe("reset()", () => {
    it("calls hcaptcha.reset() and clears token", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      capturedOpts.callback("tok");
      widget.reset();
      expect(mockSdk.reset).toHaveBeenCalledWith("widget-h-001");
      expect(widget.getToken()).toBeNull();
    });

    it("rejects pending execute() calls", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      const p = widget.execute();
      widget.reset();
      await expect(p).rejects.toBeInstanceOf(CaptchaError);
    });
  });

  describe("destroy()", () => {
    it("calls hcaptcha.remove()", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      widget.destroy();
      expect(mockSdk.remove).toHaveBeenCalledWith("widget-h-001");
    });

    it("rejects execute() after destroy", async () => {
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn() });
      await flush();
      widget.destroy();
      await expect(widget.execute()).rejects.toMatchObject({ code: "execute-failed" });
    });
  });

  describe("callbacks", () => {
    it("fires onSuccess and updates getToken()", async () => {
      const onSuccess = vi.fn();
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess });
      await flush();
      capturedOpts.callback("t");
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ value: "t", provider: "hcaptcha" }));
      expect(widget.getToken()?.value).toBe("t");
    });

    it("fires onExpire and clears token", async () => {
      const onExpire = vi.fn();
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn(), onExpire });
      await flush();
      capturedOpts.callback("t");
      capturedOpts["expired-callback"]();
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(widget.getToken()).toBeNull();
    });

    it("fires onError and rejects pending calls", async () => {
      const onError = vi.fn();
      const widget = new HCaptchaWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess: vi.fn(), onError });
      await flush();
      const p = widget.execute();
      capturedOpts["error-callback"]("rate-limited");
      await expect(p).rejects.toBeInstanceOf(CaptchaError);
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "provider-error" }));
    });
  });
});
