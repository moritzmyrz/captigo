import { describe, expect, it } from "vitest";
import { turnstile } from "../src/adapter.js";

describe("turnstile() factory", () => {
  it("returns an adapter with id 'turnstile'", () => {
    const adapter = turnstile({ siteKey: "test-key" });
    expect(adapter.meta.id).toBe("turnstile");
  });

  it("sets mode to 'managed' by default", () => {
    const adapter = turnstile({ siteKey: "test-key" });
    expect(adapter.meta.mode).toBe("managed");
  });

  it("sets mode to 'managed' when execution is 'render'", () => {
    const adapter = turnstile({ siteKey: "test-key", execution: "render" });
    expect(adapter.meta.mode).toBe("managed");
  });

  it("sets mode to 'interactive' when execution is 'execute'", () => {
    const adapter = turnstile({ siteKey: "test-key", execution: "execute" });
    expect(adapter.meta.mode).toBe("interactive");
  });

  it("always requires a container element", () => {
    expect(turnstile({ siteKey: "test-key" }).meta.requiresContainer).toBe(true);
    expect(turnstile({ siteKey: "test-key", execution: "execute" }).meta.requiresContainer).toBe(
      true,
    );
  });

  it("exposes the config it was created with", () => {
    const config = { siteKey: "my-key", theme: "dark" as const, execution: "execute" as const };
    const adapter = turnstile(config);
    expect(adapter.config).toStrictEqual(config);
  });
});
