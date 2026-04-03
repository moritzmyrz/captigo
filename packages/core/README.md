# @captigo/core

> Core types and adapter contracts for [Captigo](https://github.com/moritzmyrz/captigo) — a provider-agnostic CAPTCHA integration layer.

This package defines the shared types and the `CaptchaAdapter` / `CaptchaWidget`
interfaces that every captigo provider implements. You usually install it
alongside a provider package (Turnstile, hCaptcha, reCAPTCHA); it is also pulled
in automatically as a dependency of those adapters.

Use `@captigo/core` directly when you want to depend only on types, write helper
code against `CaptchaAdapter`, or share configuration between client and server
without importing a specific provider.

---

## Installation

```bash
npm install @captigo/core
```

Most apps install an adapter as well; `@captigo/core` is also installed automatically as a dependency of `@captigo/turnstile`, `@captigo/hcaptcha`, `@captigo/recaptcha`, `@captigo/react`, `@captigo/vue`, and `@captigo/nextjs`.

```bash
npm install @captigo/core @captigo/turnstile
```

---

## What this package exports

- **Types:** `CaptchaToken`, `VerifyResult`, `VerifyOptions`, `AdapterMeta`,
  `CaptchaMode`, `ProviderId`, and related configuration types.
- **Contracts:** `CaptchaAdapter`, `CaptchaWidget`, `RenderOptions`,
  `WidgetCallbacks`, `AdapterFactory`.
- **Errors:** `CaptchaError` and `CaptchaErrorCode`.

See the TypeScript definitions in `dist/index.d.ts` after build for the full API.

---

## Typical usage

Provider factories return a `CaptchaAdapter`. Your app passes that adapter to
framework integrations (`@captigo/react`, `@captigo/vue`) or calls
`adapter.render` / `adapter.verify` yourself:

```ts
import type { CaptchaAdapter } from "@captigo/core";
import { turnstile } from "@captigo/turnstile";

const adapter: CaptchaAdapter = turnstile({ siteKey: "..." });
```

---

## Caveats

- **This package has no widget UI.** Use a provider adapter plus `@captigo/react`, `@captigo/vue`, or your own `adapter.render()` integration.
- **Secrets never belong in client bundles.** Use each adapter’s server-side `verify` / `verifyToken` from your backend only.

---

## Documentation

- [Getting started](https://github.com/moritzmyrz/captigo/blob/main/docs/getting-started.md)
- [Server-side verification](https://github.com/moritzmyrz/captigo/blob/main/docs/server-verification.md)
- [Supported providers](https://github.com/moritzmyrz/captigo/blob/main/docs/providers.md)
- [Compatibility](https://github.com/moritzmyrz/captigo/blob/main/docs/compatibility.md)

[Monorepo overview](https://github.com/moritzmyrz/captigo#readme) · [Source](https://github.com/moritzmyrz/captigo/tree/main/packages/core) · [Issues](https://github.com/moritzmyrz/captigo/issues)
