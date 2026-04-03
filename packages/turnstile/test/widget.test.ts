import { CaptchaError } from "@captigo/core";
import type { CaptchaToken } from "@captigo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TurnstileRenderOptions } from "../src/types.js";
import { TurnstileWidget } from "../src/widget.js";

// ─── Mock script loader ───────────────────────────────────────────────────────

vi.mock("../src/script.js", () => ({
  loadScript: vi.fn().mockResolvedValue(undefined),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Flush all pending micro-tasks so async mounts can complete. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type CapturedOptions = TurnstileRenderOptions & {
  callback: NonNullable<TurnstileRenderOptions["callback"]>;
  "error-callback": NonNullable<TurnstileRenderOptions["error-callback"]>;
  "expired-callback": NonNullable<TurnstileRenderOptions["expired-callback"]>;
  "timeout-callback": NonNullable<TurnstileRenderOptions["timeout-callback"]>;
};

// ─── Setup ────────────────────────────────────────────────────────────────────

let capturedOptions: CapturedOptions;
const mockSdk = {
  render: vi.fn((_, opts: TurnstileRenderOptions) => {
    capturedOptions = opts as CapturedOptions;
    return "widget-001";
  }),
  execute: vi.fn(),
  reset: vi.fn(),
  remove: vi.fn(),
  getResponse: vi.fn(),
  isExpired: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal("turnstile", mockSdk);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("TurnstileWidget", () => {
  describe("mount", () => {
    it("calls sdk.render with the correct sitekey and options", async () => {
      const container = document.createElement("div");
      new TurnstileWidget(
        container,
        { siteKey: "test-key", theme: "dark" },
        { onSuccess: vi.fn() },
      );

      await flush();

      expect(mockSdk.render).toHaveBeenCalledWith(
        container,
        expect.objectContaining({ sitekey: "test-key", theme: "dark" }),
      );
    });

    it("skips sdk.render if the widget is destroyed before loadScript resolves", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      // Destroy synchronously before the loadScript microtask resolves.
      widget.destroy();
      await flush();

      expect(mockSdk.render).not.toHaveBeenCalled();
    });

    it("passes execution mode to sdk.render", async () => {
      const container = document.createElement("div");
      new TurnstileWidget(
        container,
        { siteKey: "k", execution: "execute" },
        { onSuccess: vi.fn() },
      );

      await flush();

      expect(mockSdk.render).toHaveBeenCalledWith(
        container,
        expect.objectContaining({ execution: "execute" }),
      );
    });
  });

  describe("getToken()", () => {
    it("returns null initially", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      expect(widget.getToken()).toBeNull();
    });

    it("returns the token after onSuccess fires", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      capturedOptions.callback("raw-token");

      expect(widget.getToken()).toMatchObject({ value: "raw-token", provider: "turnstile" });
    });
  });

  describe("execute()", () => {
    it("resolves when the SDK callback fires (managed mode)", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();

      const promise = widget.execute();
      capturedOptions.callback("my-token");

      const token = await promise;
      expect(token.value).toBe("my-token");
      expect(token.provider).toBe("turnstile");
    });

    it("resolves immediately if a token already exists", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      capturedOptions.callback("cached-token");

      const token = await widget.execute();
      expect(token.value).toBe("cached-token");
      expect(mockSdk.execute).not.toHaveBeenCalled();
    });

    it("calls sdk.execute() in interactive mode", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k", execution: "execute" },
        { onSuccess: vi.fn() },
      );

      await flush();

      const promise = widget.execute();
      await flush();

      expect(mockSdk.execute).toHaveBeenCalledWith("widget-001", undefined);

      capturedOptions.callback("interactive-token");
      await expect(promise).resolves.toMatchObject({ value: "interactive-token" });
    });

    it("forwards the action to sdk.execute() in interactive mode", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k", execution: "execute" },
        { onSuccess: vi.fn() },
      );

      await flush();
      widget.execute("checkout");
      await flush();

      expect(mockSdk.execute).toHaveBeenCalledWith("widget-001", { action: "checkout" });
    });

    it("does not call sdk.execute() twice for concurrent calls", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k", execution: "execute" },
        { onSuccess: vi.fn() },
      );

      await flush();

      widget.execute();
      widget.execute();
      await flush();

      expect(mockSdk.execute).toHaveBeenCalledTimes(1);
    });

    it("resolves all concurrent execute() calls when the token arrives", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();

      const [p1, p2, p3] = [widget.execute(), widget.execute(), widget.execute()];
      capturedOptions.callback("shared-token");

      const [t1, t2, t3] = await Promise.all([p1, p2, p3]);
      expect(t1.value).toBe("shared-token");
      expect(t2.value).toBe("shared-token");
      expect(t3.value).toBe("shared-token");
    });

    it("rejects if the widget is destroyed before resolving", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();

      const promise = widget.execute();
      widget.destroy();

      await expect(promise).rejects.toBeInstanceOf(CaptchaError);
    });
  });

  describe("reset()", () => {
    it("calls sdk.reset() with the widget ID", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      widget.reset();

      expect(mockSdk.reset).toHaveBeenCalledWith("widget-001");
    });

    it("clears the stored token", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      capturedOptions.callback("old-token");
      expect(widget.getToken()).not.toBeNull();

      widget.reset();
      expect(widget.getToken()).toBeNull();
    });

    it("rejects any pending execute() calls", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();

      const promise = widget.execute();
      widget.reset();

      await expect(promise).rejects.toBeInstanceOf(CaptchaError);
    });
  });

  describe("destroy()", () => {
    it("calls sdk.remove() with the widget ID", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      widget.destroy();

      expect(mockSdk.remove).toHaveBeenCalledWith("widget-001");
    });

    it("does not call sdk.remove if the widget was never mounted", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      widget.destroy(); // widgetId is still null at this point
      await flush();

      expect(mockSdk.remove).not.toHaveBeenCalled();
    });

    it("getToken() returns null after destroy", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      capturedOptions.callback("tok");
      expect(widget.getToken()).not.toBeNull();

      widget.destroy();
      expect(widget.getToken()).toBeNull();
    });

    it("rejects execute() calls made after destroy()", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      widget.destroy();

      await expect(widget.execute()).rejects.toMatchObject({
        code: "execute-failed",
      });
    });
  });

  describe("callbacks", () => {
    it("calls onSuccess with the CaptchaToken when the challenge completes", async () => {
      const onSuccess = vi.fn();
      new TurnstileWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess });

      await flush();
      capturedOptions.callback("tok");

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ value: "tok", provider: "turnstile" }),
      );
    });

    it("sets issuedAt to the time the challenge completed", async () => {
      const onSuccess = vi.fn();
      const before = Date.now();
      new TurnstileWidget(document.createElement("div"), { siteKey: "k" }, { onSuccess });

      await flush();
      capturedOptions.callback("tok");
      const after = Date.now();

      const token = onSuccess.mock.calls[0]?.[0] as CaptchaToken;
      expect(token.issuedAt).toBeGreaterThanOrEqual(before);
      expect(token.issuedAt).toBeLessThanOrEqual(after);
    });

    it("calls onError when the SDK fires an error", async () => {
      const onError = vi.fn();
      new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn(), onError },
      );

      await flush();
      capturedOptions["error-callback"]("110200");

      expect(onError).toHaveBeenCalledWith(expect.any(CaptchaError));
      const err = onError.mock.calls[0]?.[0] as CaptchaError;
      expect(err.code).toBe("provider-error");
      expect(err.message).toContain("110200");
    });

    it("calls onExpire when the token expires", async () => {
      const onExpire = vi.fn();
      new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn(), onExpire },
      );

      await flush();
      capturedOptions.callback("tok");
      capturedOptions["expired-callback"]();

      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    it("calls onExpire and clears state when the challenge times out", async () => {
      const onExpire = vi.fn();
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn(), onExpire },
      );

      await flush();
      capturedOptions["timeout-callback"]();

      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(widget.getToken()).toBeNull();
    });

    it("clears the token when it expires", async () => {
      const widget = new TurnstileWidget(
        document.createElement("div"),
        { siteKey: "k" },
        { onSuccess: vi.fn() },
      );

      await flush();
      capturedOptions.callback("tok");
      expect(widget.getToken()).not.toBeNull();

      capturedOptions["expired-callback"]();
      expect(widget.getToken()).toBeNull();
    });
  });
});
