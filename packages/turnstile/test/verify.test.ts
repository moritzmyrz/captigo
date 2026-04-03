import { CaptchaError } from "@captigo/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyToken } from "../src/verify.js";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockFetchOk(body: object): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(body),
    }),
  );
}

function mockFetchError(status: number): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: () => Promise.resolve({}),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("verifyToken()", () => {
  describe("request shape", () => {
    it("POSTs to the Turnstile siteverify URL", async () => {
      mockFetchOk({ success: true });
      await verifyToken("tok", "secret");

      expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.objectContaining({ method: "POST" }));
    });

    it("includes the secret and response in the request body", async () => {
      mockFetchOk({ success: true });
      await verifyToken("my-token", "my-secret");

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      const body = new URLSearchParams(init.body as string);

      expect(body.get("secret")).toBe("my-secret");
      expect(body.get("response")).toBe("my-token");
    });

    it("includes remoteip when provided", async () => {
      mockFetchOk({ success: true });
      await verifyToken("tok", "secret", { remoteip: "1.2.3.4" });

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      const body = new URLSearchParams(init.body as string);

      expect(body.get("remoteip")).toBe("1.2.3.4");
    });

    it("omits remoteip when not provided", async () => {
      mockFetchOk({ success: true });
      await verifyToken("tok", "secret");

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
      const body = new URLSearchParams(init.body as string);

      expect(body.has("remoteip")).toBe(false);
    });
  });

  describe("success response", () => {
    it("returns success: true with provider 'turnstile'", async () => {
      mockFetchOk({ success: true, challenge_ts: "2026-01-01T00:00:00Z", hostname: "example.com" });
      const result = await verifyToken("tok", "secret");

      expect(result.success).toBe(true);
      expect(result.provider).toBe("turnstile");
    });

    it("maps challenge_ts to challengeTs", async () => {
      mockFetchOk({ success: true, challenge_ts: "2026-04-01T12:00:00Z" });
      const result = await verifyToken("tok", "secret");

      expect(result.challengeTs).toBe("2026-04-01T12:00:00Z");
    });

    it("includes hostname when present", async () => {
      mockFetchOk({ success: true, hostname: "mysite.com" });
      const result = await verifyToken("tok", "secret");

      expect(result.hostname).toBe("mysite.com");
    });

    it("maps score when present", async () => {
      mockFetchOk({ success: true, score: 0.9 });
      const result = await verifyToken("tok", "secret");

      expect(result.score).toBe(0.9);
    });

    it("omits score when not present", async () => {
      mockFetchOk({ success: true });
      const result = await verifyToken("tok", "secret");

      expect(result.score).toBeUndefined();
    });
  });

  describe("failure response", () => {
    it("returns success: false when the provider rejects the token", async () => {
      mockFetchOk({ success: false, "error-codes": ["invalid-input-response"] });
      const result = await verifyToken("bad-token", "secret");

      expect(result.success).toBe(false);
      expect(result.errorCodes).toContain("invalid-input-response");
    });

    it("returns success: false without throwing", async () => {
      mockFetchOk({ success: false, "error-codes": ["timeout-or-duplicate"] });

      await expect(verifyToken("tok", "secret")).resolves.toMatchObject({ success: false });
    });
  });

  describe("error handling", () => {
    it("throws CaptchaError('verify-failed') on HTTP 403", async () => {
      mockFetchError(403);

      const err = await verifyToken("tok", "secret").catch((e: unknown) => e);
      expect(err).toBeInstanceOf(CaptchaError);
      expect((err as CaptchaError).code).toBe("verify-failed");
      expect((err as CaptchaError).provider).toBe("turnstile");
    });

    it("throws CaptchaError('verify-failed') on HTTP 500", async () => {
      mockFetchError(500);

      const err = await verifyToken("tok", "secret").catch((e: unknown) => e);
      expect(err).toBeInstanceOf(CaptchaError);
      expect((err as CaptchaError).code).toBe("verify-failed");
    });

    it("throws CaptchaError('verify-failed') when fetch rejects (network failure)", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network unreachable")));

      const err = await verifyToken("tok", "secret").catch((e: unknown) => e);
      expect(err).toBeInstanceOf(CaptchaError);
      expect((err as CaptchaError).code).toBe("verify-failed");
      expect((err as CaptchaError).message).toContain("Network unreachable");
    });
  });
});
