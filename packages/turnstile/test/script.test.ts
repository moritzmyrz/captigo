import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// loadScript() uses a module-level `loading` variable to deduplicate in-flight
// requests. Each test resets the module registry so that variable starts as
// null, giving every test a clean slate.

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function getInjectedScript(): HTMLScriptElement | null {
  return document.querySelector(`script[src="${SCRIPT_URL}"]`);
}

beforeEach(() => {
  vi.resetModules();
  vi.unstubAllGlobals();
  getInjectedScript()?.remove();
});

afterEach(() => {
  getInjectedScript()?.remove();
  vi.unstubAllGlobals();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("loadScript()", () => {
  describe("script injection", () => {
    it("appends a <script> tag to document.head", async () => {
      const { loadScript } = await import("../src/script.js");

      loadScript(); // don't await — inspect the DOM synchronously

      const script = getInjectedScript();
      expect(script).not.toBeNull();
      expect(document.head.contains(script)).toBe(true);
    });

    it("sets the correct Turnstile API URL as src", async () => {
      const { loadScript } = await import("../src/script.js");

      loadScript();

      expect(getInjectedScript()?.src).toBe(SCRIPT_URL);
    });

    it("marks the script async and defer", async () => {
      const { loadScript } = await import("../src/script.js");

      loadScript();

      const script = getInjectedScript();
      expect(script?.async).toBe(true);
      expect(script?.defer).toBe(true);
    });

    it("resolves when the script onload fires", async () => {
      const { loadScript } = await import("../src/script.js");

      const promise = loadScript();
      getInjectedScript()!.onload!(new Event("load"));

      await expect(promise).resolves.toBeUndefined();
    });

    it("rejects with CaptchaError('script-load-failed') when onerror fires", async () => {
      const { loadScript } = await import("../src/script.js");

      const promise = loadScript();
      getInjectedScript()!.onerror!(new Event("error"));

      // vi.resetModules() produces a fresh CaptchaError class, so instanceof
      // crosses module boundaries. Match on properties instead.
      const err = await promise.catch((e: unknown) => e);
      expect(err).toMatchObject({
        name: "CaptchaError",
        code: "script-load-failed",
        provider: "turnstile",
      });
    });
  });

  describe("deduplication", () => {
    it("returns the same promise for concurrent calls", async () => {
      const { loadScript } = await import("../src/script.js");

      const p1 = loadScript();
      const p2 = loadScript();
      const p3 = loadScript();

      expect(p1).toBe(p2);
      expect(p2).toBe(p3);

      getInjectedScript()!.onload!(new Event("load"));
      await p1;
    });

    it("injects exactly one <script> tag regardless of concurrent calls", async () => {
      const { loadScript } = await import("../src/script.js");

      loadScript();
      loadScript();
      loadScript();

      expect(document.querySelectorAll(`script[src="${SCRIPT_URL}"]`)).toHaveLength(1);

      getInjectedScript()!.onload!(new Event("load"));
    });

    it("resolves immediately without injecting a script if window.turnstile is already defined", async () => {
      vi.stubGlobal("turnstile", {}); // SDK pre-loaded (e.g. from a static <script> tag)
      const { loadScript } = await import("../src/script.js");

      await loadScript();

      expect(getInjectedScript()).toBeNull();
    });
  });

  describe("retry after failure", () => {
    it("clears the in-flight promise after onerror so the next call retries", async () => {
      const { loadScript } = await import("../src/script.js");

      // First attempt: fails.
      const p1 = loadScript();
      getInjectedScript()!.onerror!(new Event("error"));
      await p1.catch(() => {});

      // Remove the failed script so the DOM is clean for the next attempt.
      getInjectedScript()?.remove();

      // Second call must create a new promise, not return the failed one.
      const p2 = loadScript();
      expect(p1).not.toBe(p2);
      expect(getInjectedScript()).not.toBeNull();

      getInjectedScript()!.onload!(new Event("load"));
      await p2;
    });
  });
});
