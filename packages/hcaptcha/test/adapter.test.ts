import { describe, expect, it } from "vitest";
import { hcaptcha } from "../src/adapter.js";

describe("hcaptcha() factory", () => {
  it("returns an adapter with id 'hcaptcha'", () => {
    expect(hcaptcha({ siteKey: "k" }).meta.id).toBe("hcaptcha");
  });

  it("sets mode to 'managed' for normal size (default)", () => {
    expect(hcaptcha({ siteKey: "k" }).meta.mode).toBe("managed");
    expect(hcaptcha({ siteKey: "k", size: "normal" }).meta.mode).toBe("managed");
    expect(hcaptcha({ siteKey: "k", size: "compact" }).meta.mode).toBe("managed");
  });

  it("sets mode to 'interactive' for invisible size", () => {
    expect(hcaptcha({ siteKey: "k", size: "invisible" }).meta.mode).toBe("interactive");
  });

  it("always requires a container", () => {
    expect(hcaptcha({ siteKey: "k" }).meta.requiresContainer).toBe(true);
    expect(hcaptcha({ siteKey: "k", size: "invisible" }).meta.requiresContainer).toBe(true);
  });

  it("exposes the config it was created with", () => {
    const config = { siteKey: "my-key", size: "invisible" as const, theme: "dark" as const };
    expect(hcaptcha(config).config).toStrictEqual(config);
  });
});
