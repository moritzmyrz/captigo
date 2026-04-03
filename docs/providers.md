# Supported Providers

Captigo ships adapter packages for three major CAPTCHA providers. Each adapter conforms to the same `CaptchaAdapter` interface — your framework integration code stays identical regardless of which provider you choose.

---

## Cloudflare Turnstile — `@captigo/turnstile`

[Turnstile](https://developers.cloudflare.com/turnstile/) is Cloudflare's CAPTCHA replacement. It offers both managed (visible checkbox) and invisible modes, and never serves puzzles to legitimate users.

### Installation

```bash
pnpm add @captigo/turnstile
```

### Usage

```ts
import { turnstile, verifyToken } from "@captigo/turnstile";

// Client — create adapter
const adapter = turnstile({
  siteKey: "0x4AAAAAAAxxx",       // required
  execution: "render",            // "render" (managed, default) | "execute" (invisible)
  theme: "auto",                  // "light" | "dark" | "auto"
  size: "normal",                 // "normal" | "compact" | "flexible"
  language: "auto",               // BCP 47 language tag or "auto"
  action: "login",                // optional label for analytics
  appearance: "always",           // "always" | "execute" | "interaction-only"
  retry: "auto",                  // "auto" | "never"
  refreshExpired: "auto",         // "auto" | "manual" | "never"
});

// Server — verify
const result = await verifyToken(submittedToken, process.env.TURNSTILE_SECRET!);
```

### Modes

| `execution` | `adapter.meta.mode` | Description |
|-------------|---------------------|-------------|
| `"render"` (default) | `"managed"` | Visible checkbox; challenge fires automatically |
| `"execute"` | `"interactive"` | Invisible; call `widget.execute()` on form submit |

### Server response fields

| Field | Type | Notes |
|-------|------|-------|
| `success` | `boolean` | Whether the token is valid |
| `challengeTs` | `string` | ISO 8601 timestamp of the challenge |
| `hostname` | `string` | Domain where the challenge was solved |
| `errorCodes` | `string[]` | Present when `success: false` |

---

## hCaptcha — `@captigo/hcaptcha`

[hCaptcha](https://www.hcaptcha.com/) is a privacy-focused CAPTCHA. It supports visible and invisible modes and offers an enterprise endpoint for additional configuration.

### Installation

```bash
pnpm add @captigo/hcaptcha
```

### Usage

```ts
import { hcaptcha, verifyToken } from "@captigo/hcaptcha";

// Client
const adapter = hcaptcha({
  siteKey: "10000000-ffff-ffff-ffff-000000000001",  // required
  size: "normal",         // "normal" (managed) | "compact" | "invisible" (interactive)
  theme: "light",         // "light" | "dark"
  language: "en",         // BCP 47 language tag
  tabindex: 0,
  endpoint: "https://hcaptcha.com", // override for enterprise
});

// Server
const result = await verifyToken(token, process.env.HCAPTCHA_SECRET!);
```

### Modes

| `size` | `adapter.meta.mode` | Description |
|--------|---------------------|-------------|
| `"normal"` (default) | `"managed"` | Standard checkbox |
| `"compact"` | `"managed"` | Compact checkbox |
| `"invisible"` | `"interactive"` | No visible widget; call `execute()` on submit |

### Notable differences from Turnstile

- hCaptcha fires an additional `chalexpired-callback` (challenge window timed out without solving). Captigo maps this to `onExpire`.
- The server verification endpoint returns a `score` field for enterprise accounts.

---

## Google reCAPTCHA — `@captigo/recaptcha`

Google reCAPTCHA comes in two very different versions. Captigo provides separate factory functions for each.

### Installation

```bash
pnpm add @captigo/recaptcha
```

### reCAPTCHA v2

Renders a visible checkbox (or invisible widget).

```ts
import { recaptchaV2, verifyV2Token } from "@captigo/recaptcha";

const adapter = recaptchaV2({
  siteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",  // required
  size: "checkbox",       // "checkbox" (managed) | "invisible" (interactive) | "compact"
  theme: "light",         // "light" | "dark"
  badge: "bottomright",   // "bottomright" | "bottomleft" | "inline" (invisible only)
  language: "en",
});

const result = await verifyV2Token(token, process.env.RECAPTCHA_SECRET!);
```

### reCAPTCHA v3

Score-based, fully invisible. No user interaction required.

```ts
import { recaptchaV3, verifyV3Token } from "@captigo/recaptcha";

const adapter = recaptchaV3({
  siteKey: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",  // required
  action: "login",        // optional action label for analytics
});

// Call execute() to get a token. No container needed.
const token = await widget.execute("login");

// Server — returns score (0.0–1.0) in addition to success
const result = await verifyV3Token(token.value, process.env.RECAPTCHA_V3_SECRET!);
if (result.score < 0.5) return reject();
```

### Modes

| Factory | `adapter.meta.mode` | `requiresContainer` |
|---------|---------------------|---------------------|
| `recaptchaV2({ size: "checkbox" })` | `"managed"` | `true` |
| `recaptchaV2({ size: "invisible" })` | `"interactive"` | `true` |
| `recaptchaV3(...)` | `"passive"` | `false` |

### Notable differences

- **reCAPTCHA v2 has no `remove()` API.** Calling `widget.destroy()` calls `grecaptcha.reset()` instead of removing the element. This is a limitation of the provider SDK.
- **reCAPTCHA v3** does not render a DOM widget at all. The `<Captcha>` component still renders an empty container, but the adapter ignores it.
- **Separate secrets.** v2 and v3 use different secret keys.

---

## Choosing a provider

| | Turnstile | hCaptcha | reCAPTCHA v2 | reCAPTCHA v3 |
|---|---|---|---|---|
| Visible checkbox | ✓ | ✓ | ✓ | — |
| Invisible mode | ✓ | ✓ | ✓ | — |
| Score-based | ✓ | Enterprise | — | ✓ |
| No puzzles | ✓ | ✗ | ✗ | ✓ |
| Privacy-focused | ✓ | ✓ | ✗ | ✗ |
| Free tier | ✓ | ✓ | ✓ | ✓ |
