import { describe, expect, it } from "vitest";
import { captchaTokenFromRequest, clientIpFromRequest } from "../src/request.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonRequest(body: unknown, extra?: HeadersInit): Request {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...extra },
    body: JSON.stringify(body),
  });
}

function formRequest(fields: Record<string, string>): Request {
  const params = new URLSearchParams(fields);
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
}

function headersOnlyRequest(headers: HeadersInit): Request {
  return new Request("http://localhost/api", { headers });
}

// ─── captchaTokenFromRequest ──────────────────────────────────────────────────

describe("captchaTokenFromRequest()", () => {
  describe("JSON body", () => {
    it("returns the token using the default field name", async () => {
      const req = jsonRequest({ token: "test-token-abc" });
      expect(await captchaTokenFromRequest(req)).toBe("test-token-abc");
    });

    it("returns the token using a custom field name", async () => {
      const req = jsonRequest({ "cf-turnstile-response": "ts-token-xyz" });
      expect(await captchaTokenFromRequest(req, "cf-turnstile-response")).toBe("ts-token-xyz");
    });

    it("returns null when the field is absent", async () => {
      const req = jsonRequest({ other: "value" });
      expect(await captchaTokenFromRequest(req)).toBeNull();
    });

    it("returns null when the field is an empty string", async () => {
      const req = jsonRequest({ token: "" });
      expect(await captchaTokenFromRequest(req)).toBeNull();
    });

    it("returns null when the field is not a string", async () => {
      const req = jsonRequest({ token: 12345 });
      expect(await captchaTokenFromRequest(req)).toBeNull();
    });

    it("returns null when the body is malformed JSON", async () => {
      const req = new Request("http://localhost/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json at all",
      });
      expect(await captchaTokenFromRequest(req)).toBeNull();
    });
  });

  describe("FormData / URL-encoded body", () => {
    it("reads the token from a URL-encoded body", async () => {
      const req = formRequest({ token: "form-token-abc" });
      expect(await captchaTokenFromRequest(req)).toBe("form-token-abc");
    });

    it("reads the token using a custom field name from URL-encoded body", async () => {
      const req = formRequest({ "cf-turnstile-response": "ts-form-token" });
      expect(await captchaTokenFromRequest(req, "cf-turnstile-response")).toBe("ts-form-token");
    });

    it("returns null when the field is absent from form data", async () => {
      const req = formRequest({ other: "value" });
      expect(await captchaTokenFromRequest(req)).toBeNull();
    });

    it("returns null when the field is empty in form data", async () => {
      const req = formRequest({ token: "" });
      expect(await captchaTokenFromRequest(req)).toBeNull();
    });
  });

  describe("missing or unknown content-type", () => {
    it("falls back to JSON parsing when content-type is absent", async () => {
      // Omit the content-type header — should still try JSON.
      const req = new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ token: "bare-json-token" }),
      });
      expect(await captchaTokenFromRequest(req)).toBe("bare-json-token");
    });
  });
});

// ─── clientIpFromRequest ──────────────────────────────────────────────────────

describe("clientIpFromRequest()", () => {
  it("returns CF-Connecting-IP when present", () => {
    const req = headersOnlyRequest({ "cf-connecting-ip": "1.2.3.4" });
    expect(clientIpFromRequest(req)).toBe("1.2.3.4");
  });

  it("prefers CF-Connecting-IP over X-Forwarded-For", () => {
    const req = headersOnlyRequest({
      "cf-connecting-ip": "1.2.3.4",
      "x-forwarded-for": "9.9.9.9, 8.8.8.8",
    });
    expect(clientIpFromRequest(req)).toBe("1.2.3.4");
  });

  it("returns the first address from X-Forwarded-For", () => {
    const req = headersOnlyRequest({ "x-forwarded-for": "5.6.7.8, 192.168.1.1" });
    expect(clientIpFromRequest(req)).toBe("5.6.7.8");
  });

  it("trims whitespace from X-Forwarded-For addresses", () => {
    const req = headersOnlyRequest({ "x-forwarded-for": "  10.0.0.1  , 10.0.0.2" });
    expect(clientIpFromRequest(req)).toBe("10.0.0.1");
  });

  it("falls back to X-Real-IP when X-Forwarded-For is absent", () => {
    const req = headersOnlyRequest({ "x-real-ip": "3.4.5.6" });
    expect(clientIpFromRequest(req)).toBe("3.4.5.6");
  });

  it("returns undefined when no IP headers are present", () => {
    const req = headersOnlyRequest({ "content-type": "application/json" });
    expect(clientIpFromRequest(req)).toBeUndefined();
  });
});
