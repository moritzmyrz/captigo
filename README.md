# Captigo

**Provider-agnostic CAPTCHA integration for the modern web.**

[![CI](https://github.com/moritzmyrz/captigo/actions/workflows/ci.yml/badge.svg)](https://github.com/moritzmyrz/captigo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

Captigo is a TypeScript-first library ecosystem for integrating CAPTCHA providers. Instead of writing provider-specific code throughout your application, you get a unified interface that works across hCaptcha, Turnstile, reCAPTCHA, and more — with first-class support for popular frameworks.

## Why Captigo?

CAPTCHA providers all have slightly different APIs, token shapes, widget lifecycles, and server-side verification flows. Switching providers — or running A/B tests between them — means touching a lot of code. Captigo fixes that with a consistent abstraction that stays out of your way.

- **One API, any provider.** Swap hCaptcha for Turnstile without rewriting your integration.
- **Tree-shakeable.** Import only the provider you need. No dead code.
- **Framework-ready.** First-class integrations for React, Next.js, and SvelteKit (planned).
- **Fully typed.** Strict TypeScript throughout. No `any`.
- **Zero magic.** No hidden globals, no monkey-patching, no surprises.

## Packages

This is a monorepo. Packages are published independently under the `@captigo` scope.

| Package | Description | Status |
|---|---|---|
| [`captigo`](./packages/core) | Core types and provider interface | Scaffolded |
| [`@captigo/turnstile`](./packages/turnstile) | Cloudflare Turnstile adapter | Scaffolded |
| [`@captigo/hcaptcha`](./packages/hcaptcha) | hCaptcha adapter | Scaffolded |
| [`@captigo/recaptcha`](./packages/recaptcha) | Google reCAPTCHA v2/v3 adapter | Scaffolded |
| [`@captigo/react`](./packages/react) | React hooks and components | Scaffolded |
| [`@captigo/vue`](./packages/vue) | Vue 3 composables and components | Scaffolded |
| `@captigo/nextjs` | Next.js integration (App Router + Pages) | Planned |
| `@captigo/sveltekit` | SvelteKit integration | Planned |

## Design

Every provider implements a common `CaptchaProvider` interface defined in `@captigo/core`. Your application code only ever depends on `@captigo/core` — the specific provider is injected at the edges of your system.

```
┌─────────────────────────────────┐
│         Your application        │
│   depends on @captigo/core only │
└────────────────┬────────────────┘
                 │ CaptchaProvider interface
     ┌───────────┼───────────┐
     ▼           ▼           ▼
 hCaptcha    Turnstile   reCAPTCHA
```

This means you can configure the provider once (e.g. based on an environment variable) and the rest of your code stays unchanged.

## Getting started

> Packages are not yet published. This section will be updated when the first stable release is out.

```bash
pnpm add @captigo/core @captigo/turnstile
```

## Monorepo development

```bash
git clone https://github.com/moritzmyrz/captigo.git
cd captigo
pnpm install

pnpm build       # build all packages
pnpm typecheck   # type-check all packages
pnpm lint        # run Biome linter
pnpm test        # run all tests
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full development guide.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request, and review our [Code of Conduct](./CODE_OF_CONDUCT.md).

## License

MIT — see [LICENSE](./LICENSE).
