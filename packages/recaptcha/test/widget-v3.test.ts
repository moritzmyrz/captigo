import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaptchaError } from "captigo";
import { ReCaptchaV3Widget } from "../src/widget-v3.js";

// Mock both loadV3Script and whenReady so tests don't touch the DOM.
vi.mock("../src/script.js", () => ({
  loadV3Script: vi.fn().mockResolvedValue(undefined),
  whenReady: vi.fn().mockResolvedValue(undefined),
}));

let mockExecute: ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockExecute = vi.fn().mockResolvedValue("v3-raw-token");
  vi.stubGlobal("grecaptcha", {
    execute: mockExecute,
    ready: vi.fn((cb: () => void) => cb()),
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("ReCaptchaV3Widget", () => {
  it("calls grecaptcha.execute(siteKey, { action }) on execute()", async () => {
    const widget = new ReCaptchaV3Widget(
      { siteKey: "sk", action: "login" },
      { onSuccess: vi.fn() },
    );

    await widget.execute("checkout");

    expect(mockExecute).toHaveBeenCalledWith("sk", { action: "checkout" });
  });

  it("uses config.action as the default action", async () => {
    const widget = new ReCaptchaV3Widget(
      { siteKey: "sk", action: "login" },
      { onSuccess: vi.fn() },
    );

    await widget.execute();

    expect(mockExecute).toHaveBeenCalledWith("sk", { action: "login" });
  });

  it("falls back to 'default' action when none is configured", async () => {
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess: vi.fn() });
    await widget.execute();
    expect(mockExecute).toHaveBeenCalledWith("sk", { action: "default" });
  });

  it("resolves with the token and fires onSuccess", async () => {
    const onSuccess = vi.fn();
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess });

    const token = await widget.execute("submit");

    expect(token.value).toBe("v3-raw-token");
    expect(token.provider).toBe("recaptcha-v3");
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({ value: "v3-raw-token" }));
  });

  it("stores the last token in getToken()", async () => {
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess: vi.fn() });
    expect(widget.getToken()).toBeNull();
    await widget.execute();
    expect(widget.getToken()?.value).toBe("v3-raw-token");
  });

  it("reset() clears the last token", async () => {
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess: vi.fn() });
    await widget.execute();
    widget.reset();
    expect(widget.getToken()).toBeNull();
  });

  it("rejects execute() after destroy()", async () => {
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess: vi.fn() });
    widget.destroy();
    await expect(widget.execute()).rejects.toMatchObject({ code: "execute-failed" });
  });

  it("fires onError and rethrows on grecaptcha failure", async () => {
    mockExecute.mockRejectedValueOnce(new Error("network error"));
    const onError = vi.fn();
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess: vi.fn(), onError });

    await expect(widget.execute()).rejects.toBeInstanceOf(CaptchaError);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "execute-failed" }));
  });

  it("supports concurrent execute() calls independently", async () => {
    const widget = new ReCaptchaV3Widget({ siteKey: "sk" }, { onSuccess: vi.fn() });

    const [t1, t2] = await Promise.all([widget.execute("a"), widget.execute("b")]);
    expect(t1.value).toBe("v3-raw-token");
    expect(t2.value).toBe("v3-raw-token");
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });
});
