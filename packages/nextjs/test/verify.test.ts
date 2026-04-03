import { describe, expect, it, vi } from "vitest";
import type { CaptchaAdapter, VerifyResult } from "@captigo/core";
import { CaptchaError } from "@captigo/core";
import { verifyCaptchaFromRequest } from "../src/verify.js";

// ─── Test fixtures ────────────────────────────────────────────────────────────

function makeAdapter(result: VerifyResult): CaptchaAdapter {
  return {
    meta: { id: "turnstile", mode: "managed", requiresContainer: true },
    config: { siteKey: "test-site-key" },
    render: vi.fn(),
    verify: vi.fn().mockResolvedValue(result),
  };
}

function jsonPost(body: unknown, headers?: HeadersInit): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const SUCCESS: VerifyResult = { success: true, provider: "turnstile" };
const FAILURE: VerifyResult = {
  success: false,
  provider: "turnstile",
  errorCodes: ["invalid-input-response"],
};

// ─── verifyCaptchaFromRequest() ───────────────────────────────────────────────

describe("verifyCaptchaFromRequest()", () => {
  it("calls adapter.verify with the token and secretKey", async () => {
    const adapter = makeAdapter(SUCCESS);
    const req = jsonPost({ token: "tok_abc" });

    await verifyCaptchaFromRequest(req, adapter, "secret-key");

    expect(adapter.verify).toHaveBeenCalledWith("tok_abc", "secret-key", undefined);
  });

  it("returns the VerifyResult from the adapter", async () => {
    const adapter = makeAdapter(SUCCESS);
    const req = jsonPost({ token: "tok_abc" });

    const result = await verifyCaptchaFromRequest(req, adapter, "secret-key");

    expect(result).toEqual(SUCCESS);
  });

  it("returns a failure result without throwing", async () => {
    const adapter = makeAdapter(FAILURE);
    const req = jsonPost({ token: "tok_bad" });

    const result = await verifyCaptchaFromRequest(req, adapter, "secret-key");

    expect(result.success).toBe(false);
    expect(result.errorCodes).toEqual(["invalid-input-response"]);
  });

  describe("IP forwarding", () => {
    it("forwards CF-Connecting-IP to adapter.verify by default", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ token: "tok_abc" }, { "cf-connecting-ip": "1.2.3.4" });

      await verifyCaptchaFromRequest(req, adapter, "secret-key");

      expect(adapter.verify).toHaveBeenCalledWith("tok_abc", "secret-key", {
        remoteip: "1.2.3.4",
      });
    });

    it("forwards the first X-Forwarded-For address when CF header is absent", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ token: "tok_abc" }, { "x-forwarded-for": "5.6.7.8, 192.168.1.1" });

      await verifyCaptchaFromRequest(req, adapter, "secret-key");

      expect(adapter.verify).toHaveBeenCalledWith("tok_abc", "secret-key", {
        remoteip: "5.6.7.8",
      });
    });

    it("passes undefined options when no IP headers are present", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ token: "tok_abc" });

      await verifyCaptchaFromRequest(req, adapter, "secret-key");

      expect(adapter.verify).toHaveBeenCalledWith("tok_abc", "secret-key", undefined);
    });

    it("does not forward IP when forwardIp is false", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ token: "tok_abc" }, { "cf-connecting-ip": "1.2.3.4" });

      await verifyCaptchaFromRequest(req, adapter, "secret-key", { forwardIp: false });

      expect(adapter.verify).toHaveBeenCalledWith("tok_abc", "secret-key", undefined);
    });
  });

  describe("custom field name", () => {
    it("reads the token from a custom field when specified", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ "cf-turnstile-response": "cf-tok" });

      await verifyCaptchaFromRequest(req, adapter, "secret-key", {
        fieldName: "cf-turnstile-response",
      });

      expect(adapter.verify).toHaveBeenCalledWith("cf-tok", "secret-key", undefined);
    });
  });

  describe("missing token", () => {
    it("throws CaptchaError when the token field is absent from the body", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ other: "field" });

      await expect(verifyCaptchaFromRequest(req, adapter, "secret-key")).rejects.toMatchObject({
        name: "CaptchaError",
        code: "execute-failed",
      });
    });

    it("includes the expected field name in the error message", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({ other: "field" });

      const err = await verifyCaptchaFromRequest(req, adapter, "secret-key").catch((e) => e);

      expect((err as CaptchaError).message).toContain('"token"');
    });

    it("sets the provider on the thrown CaptchaError to the adapter's provider id", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({});

      const err = await verifyCaptchaFromRequest(req, adapter, "secret-key").catch((e) => e);

      expect((err as CaptchaError).provider).toBe("turnstile");
    });

    it("includes a custom fieldName in the error message", async () => {
      const adapter = makeAdapter(SUCCESS);
      const req = jsonPost({});

      const err = await verifyCaptchaFromRequest(req, adapter, "secret-key", {
        fieldName: "captchaToken",
      }).catch((e) => e);

      expect((err as CaptchaError).message).toContain('"captchaToken"');
    });
  });

  describe("adapter errors", () => {
    it("propagates CaptchaErrors thrown by adapter.verify", async () => {
      const adapter = makeAdapter(SUCCESS);
      const verifyError = new CaptchaError("verify-failed", "Network timeout", "turnstile");
      vi.mocked(adapter.verify).mockRejectedValue(verifyError);

      const req = jsonPost({ token: "tok_abc" });

      await expect(verifyCaptchaFromRequest(req, adapter, "secret-key")).rejects.toThrow(
        verifyError,
      );
    });
  });
});
