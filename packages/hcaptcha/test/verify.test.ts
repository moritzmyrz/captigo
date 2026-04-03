import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CaptchaError } from "captigo";
import { verifyToken } from "../src/verify.js";

const VERIFY_URL = "https://api.hcaptcha.com/siteverify";

function mockOk(body: object) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) }));
}
function mockErr(status: number) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status, json: () => Promise.resolve({}) }));
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("verifyToken() — hCaptcha", () => {
  it("POSTs to the hCaptcha siteverify URL", async () => {
    mockOk({ success: true });
    await verifyToken("tok", "secret");
    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.objectContaining({ method: "POST" }));
  });

  it("sends secret and response fields", async () => {
    mockOk({ success: true });
    await verifyToken("my-token", "my-secret");
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get("secret")).toBe("my-secret");
    expect(body.get("response")).toBe("my-token");
  });

  it("includes remoteip when provided", async () => {
    mockOk({ success: true });
    await verifyToken("tok", "secret", { remoteip: "10.0.0.1" });
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(new URLSearchParams(init.body as string).get("remoteip")).toBe("10.0.0.1");
  });

  it("returns success: true with provider 'hcaptcha'", async () => {
    mockOk({ success: true, challenge_ts: "2026-01-01T00:00:00Z", hostname: "example.com" });
    const r = await verifyToken("tok", "secret");
    expect(r.success).toBe(true);
    expect(r.provider).toBe("hcaptcha");
    expect(r.challengeTs).toBe("2026-01-01T00:00:00Z");
    expect(r.hostname).toBe("example.com");
  });

  it("returns success: false without throwing", async () => {
    mockOk({ success: false, "error-codes": ["invalid-input-response"] });
    const r = await verifyToken("bad", "secret");
    expect(r.success).toBe(false);
    expect(r.errorCodes).toContain("invalid-input-response");
  });

  it("throws CaptchaError('verify-failed') on HTTP 403", async () => {
    mockErr(403);
    const err = await verifyToken("tok", "secret").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(CaptchaError);
    expect((err as CaptchaError).code).toBe("verify-failed");
    expect((err as CaptchaError).provider).toBe("hcaptcha");
  });

  it("throws CaptchaError('verify-failed') on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const err = await verifyToken("tok", "secret").catch((e: unknown) => e);
    expect((err as CaptchaError).code).toBe("verify-failed");
    expect((err as CaptchaError).message).toContain("timeout");
  });
});
