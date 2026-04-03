import type { CaptchaError } from "@captigo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyV2Token, verifyV3Token } from "../src/verify.js";

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

function mockOk(body: object) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) }),
  );
}
function mockErr(status: number) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, status, json: () => Promise.resolve({}) }),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("verifyV2Token()", () => {
  it("POSTs to the Google siteverify URL", async () => {
    mockOk({ success: true });
    await verifyV2Token("tok", "secret");
    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
  });

  it("returns provider 'recaptcha-v2'", async () => {
    mockOk({ success: true, hostname: "example.com" });
    const r = await verifyV2Token("tok", "secret");
    expect(r.provider).toBe("recaptcha-v2");
    expect(r.hostname).toBe("example.com");
  });

  it("returns success: false without throwing", async () => {
    mockOk({ success: false, "error-codes": ["invalid-input-response"] });
    const r = await verifyV2Token("bad", "secret");
    expect(r.success).toBe(false);
    expect(r.errorCodes).toContain("invalid-input-response");
  });

  it("throws CaptchaError('verify-failed') on HTTP error", async () => {
    mockErr(500);
    const err = await verifyV2Token("tok", "secret").catch((e: unknown) => e);
    expect((err as CaptchaError).code).toBe("verify-failed");
    expect((err as CaptchaError).provider).toBe("recaptcha-v2");
  });
});

describe("verifyV3Token()", () => {
  it("returns provider 'recaptcha-v3'", async () => {
    mockOk({ success: true, score: 0.9, action: "login" });
    const r = await verifyV3Token("tok", "secret");
    expect(r.provider).toBe("recaptcha-v3");
  });

  it("includes score in the result", async () => {
    mockOk({ success: true, score: 0.7 });
    const r = await verifyV3Token("tok", "secret");
    expect(r.score).toBe(0.7);
  });

  it("includes action in the result for cross-checking", async () => {
    mockOk({ success: true, score: 0.9, action: "checkout" });
    const r = await verifyV3Token("tok", "secret");
    expect(r.action).toBe("checkout");
  });

  it("returns success: false for low-score tokens without throwing", async () => {
    mockOk({ success: false, score: 0.1, "error-codes": ["timeout-or-duplicate"] });
    const r = await verifyV3Token("tok", "secret");
    expect(r.success).toBe(false);
    expect(r.score).toBe(0.1);
  });

  it("throws CaptchaError('verify-failed') on HTTP error", async () => {
    mockErr(403);
    const err = await verifyV3Token("tok", "secret").catch((e: unknown) => e);
    expect((err as CaptchaError).code).toBe("verify-failed");
    expect((err as CaptchaError).provider).toBe("recaptcha-v3");
  });
});
