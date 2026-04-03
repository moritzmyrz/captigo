import { describe, expect, it } from "vitest";
import { recaptchaV2 } from "../src/adapter-v2.js";
import { recaptchaV3 } from "../src/adapter-v3.js";

describe("recaptchaV2() factory", () => {
  it("has id 'recaptcha-v2'", () => {
    expect(recaptchaV2({ siteKey: "k" }).meta.id).toBe("recaptcha-v2");
  });

  it("is managed for checkbox (default)", () => {
    expect(recaptchaV2({ siteKey: "k" }).meta.mode).toBe("managed");
    expect(recaptchaV2({ siteKey: "k", size: "checkbox" }).meta.mode).toBe("managed");
    expect(recaptchaV2({ siteKey: "k", size: "compact" }).meta.mode).toBe("managed");
  });

  it("is interactive for invisible", () => {
    expect(recaptchaV2({ siteKey: "k", size: "invisible" }).meta.mode).toBe("interactive");
  });

  it("always requires a container", () => {
    expect(recaptchaV2({ siteKey: "k" }).meta.requiresContainer).toBe(true);
  });

  it("exposes config", () => {
    const c = { siteKey: "x", size: "invisible" as const, theme: "dark" as const };
    expect(recaptchaV2(c).config).toStrictEqual(c);
  });
});

describe("recaptchaV3() factory", () => {
  it("has id 'recaptcha-v3'", () => {
    expect(recaptchaV3({ siteKey: "k" }).meta.id).toBe("recaptcha-v3");
  });

  it("is passive", () => {
    expect(recaptchaV3({ siteKey: "k" }).meta.mode).toBe("passive");
  });

  it("does not require a container", () => {
    expect(recaptchaV3({ siteKey: "k" }).meta.requiresContainer).toBe(false);
  });

  it("exposes config including action", () => {
    const c = { siteKey: "k", action: "login" };
    expect(recaptchaV3(c).config).toStrictEqual(c);
  });
});
