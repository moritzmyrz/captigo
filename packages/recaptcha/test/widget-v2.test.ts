import { CaptchaError } from "@captigo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GrecaptchaV2RenderOptions } from "../src/types.js";
import { ReCaptchaV2Widget } from "../src/widget-v2.js";

vi.mock("../src/script.js", () => ({ loadV2Script: vi.fn().mockResolvedValue(undefined) }));

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

type CapturedOpts = GrecaptchaV2RenderOptions & {
  callback: NonNullable<GrecaptchaV2RenderOptions["callback"]>;
  "expired-callback": NonNullable<GrecaptchaV2RenderOptions["expired-callback"]>;
  "error-callback": NonNullable<GrecaptchaV2RenderOptions["error-callback"]>;
};

let capturedOpts: CapturedOpts;

// reCAPTCHA v2 widget IDs are numbers, not strings.
const mockSdk = {
  render: vi.fn((_: HTMLElement, opts: GrecaptchaV2RenderOptions) => {
    capturedOpts = opts as CapturedOpts;
    return 42; // numeric widget ID
  }),
  execute: vi.fn(),
  reset: vi.fn(),
  getResponse: vi.fn(),
  ready: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal("grecaptcha", mockSdk);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("ReCaptchaV2Widget", () => {
  it("renders with numeric widget ID", async () => {
    const c = document.createElement("div");
    new ReCaptchaV2Widget(c, { siteKey: "sk" }, { onSuccess: vi.fn() });
    await flush();
    expect(mockSdk.render).toHaveBeenCalledWith(c, expect.objectContaining({ sitekey: "sk" }));
  });

  it("maps 'checkbox' size to 'normal' for the SDK", async () => {
    const c = document.createElement("div");
    new ReCaptchaV2Widget(c, { siteKey: "sk", size: "checkbox" }, { onSuccess: vi.fn() });
    await flush();
    expect(mockSdk.render).toHaveBeenCalledWith(c, expect.objectContaining({ size: "normal" }));
  });

  it("resolves execute() when callback fires (managed mode)", async () => {
    const widget = new ReCaptchaV2Widget(
      document.createElement("div"),
      { siteKey: "k" },
      { onSuccess: vi.fn() },
    );
    await flush();
    const p = widget.execute();
    capturedOpts.callback("v2-tok");
    await expect(p).resolves.toMatchObject({ value: "v2-tok", provider: "recaptcha-v2" });
  });

  it("calls grecaptcha.execute(widgetId) for invisible mode", async () => {
    const widget = new ReCaptchaV2Widget(
      document.createElement("div"),
      { siteKey: "k", size: "invisible" },
      { onSuccess: vi.fn() },
    );
    await flush();
    widget.execute();
    await flush();
    expect(mockSdk.execute).toHaveBeenCalledWith(42);
  });

  it("calls grecaptcha.reset() on reset()", async () => {
    const widget = new ReCaptchaV2Widget(
      document.createElement("div"),
      { siteKey: "k" },
      { onSuccess: vi.fn() },
    );
    await flush();
    widget.reset();
    expect(mockSdk.reset).toHaveBeenCalledWith(42);
  });

  it("rejects pending execute() on reset()", async () => {
    const widget = new ReCaptchaV2Widget(
      document.createElement("div"),
      { siteKey: "k" },
      { onSuccess: vi.fn() },
    );
    await flush();
    const p = widget.execute();
    widget.reset();
    await expect(p).rejects.toBeInstanceOf(CaptchaError);
  });

  it("fires onExpire and clears token", async () => {
    const onExpire = vi.fn();
    const widget = new ReCaptchaV2Widget(
      document.createElement("div"),
      { siteKey: "k" },
      { onSuccess: vi.fn(), onExpire },
    );
    await flush();
    capturedOpts.callback("tok");
    capturedOpts["expired-callback"]();
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(widget.getToken()).toBeNull();
  });

  it("fires onError and rejects pending", async () => {
    const onError = vi.fn();
    const widget = new ReCaptchaV2Widget(
      document.createElement("div"),
      { siteKey: "k" },
      { onSuccess: vi.fn(), onError },
    );
    await flush();
    const p = widget.execute();
    capturedOpts["error-callback"]();
    await expect(p).rejects.toBeInstanceOf(CaptchaError);
    expect(onError).toHaveBeenCalled();
  });
});
