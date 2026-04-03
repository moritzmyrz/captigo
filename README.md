# Captigo

**Provider-agnostic CAPTCHA integration for the modern web.**

[![CI](https://github.com/moritzmyrz/captigo/actions/workflows/ci.yml/badge.svg)](https://github.com/moritzmyrz/captigo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

---

Captigo is a TypeScript-first library ecosystem for integrating CAPTCHA providers. Instead of coupling your application to a specific provider's API, you get a single unified interface that works across Cloudflare Turnstile, hCaptcha, and Google reCAPTCHA — with first-class React and Vue 3 integrations.

## Why Captigo?

Every provider has slightly different APIs, widget lifecycles, token shapes, and server-side verification flows. Switching providers — or A/B testing between them — means touching a lot of code. Captigo fixes that with a consistent abstraction that stays out of your way.

- **One API, any provider.** Swap Turnstile for hCaptcha without rewriting your integration.
- **Framework-native.** React hooks and components. Vue composables. Both feel idiomatic.
- **Fully typed.** Strict TypeScript throughout. No `any`. No guessing.
- **Tree-shakeable.** Import only what you use. Zero dead code in production bundles.
- **Zero magic.** No hidden globals, no monkey-patching, no surprises.

## Packages

| Package | npm | Description |
|---|---|---|
| [`@captigo/core`](./packages/core) | [![npm](https://img.shields.io/npm/v/@captigo/core)](https://www.npmjs.com/package/@captigo/core) | Core types and provider adapter interface |
| [`@captigo/turnstile`](./packages/turnstile) | [![npm](https://img.shields.io/npm/v/@captigo/turnstile)](https://www.npmjs.com/package/@captigo/turnstile) | Cloudflare Turnstile adapter |
| [`@captigo/hcaptcha`](./packages/hcaptcha) | [![npm](https://img.shields.io/npm/v/@captigo/hcaptcha)](https://www.npmjs.com/package/@captigo/hcaptcha) | hCaptcha adapter |
| [`@captigo/recaptcha`](./packages/recaptcha) | [![npm](https://img.shields.io/npm/v/@captigo/recaptcha)](https://www.npmjs.com/package/@captigo/recaptcha) | Google reCAPTCHA v2/v3 adapter |
| [`@captigo/react`](./packages/react) | [![npm](https://img.shields.io/npm/v/@captigo/react)](https://www.npmjs.com/package/@captigo/react) | React hooks and components |
| [`@captigo/vue`](./packages/vue) | [![npm](https://img.shields.io/npm/v/@captigo/vue)](https://www.npmjs.com/package/@captigo/vue) | Vue 3 composables and components |
| [`@captigo/nextjs`](./packages/nextjs) | [![npm](https://img.shields.io/npm/v/@captigo/nextjs)](https://www.npmjs.com/package/@captigo/nextjs) | Next.js helpers — token extraction, IP forwarding, route handler verification |
| `@captigo/sveltekit` | — | SvelteKit integration *(planned)* |

## Compatibility

The table below describes what each provider adapter actually supports today.

| Provider | Visible | Invisible | Passive | Reset | Destroy | Verify | Score | React | Vue | Example | Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Turnstile | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **stable** |
| hCaptcha | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | **beta** |
| reCAPTCHA v2 | ✅ | ✅ | — | ✅ | ⚠️ | ✅ | — | ✅ | ✅ | — | **beta** |
| reCAPTCHA v3 | — | — | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | **beta** |

**Column key:**
- **Visible** — managed widget (visible checkbox, fires automatically)
- **Invisible** — interactive widget, challenge fires on explicit `widget.execute()`
- **Passive** — score-based, no user interaction or DOM widget (reCAPTCHA v3)
- **Verify** — server-side token verification helper included
- **Score** — verification result includes a risk score (`0.0`–`1.0`)

**Status key:**
- **stable** — primary supported path; well-tested; actively maintained
- **beta** — functional and tested; receives less focused attention; edge cases may exist

> ⚠️ **reCAPTCHA v2 destroy:** the provider SDK has no `remove()` API, so `widget.destroy()` calls `reset()` internally. The widget element is not removed from the DOM.

> — **reCAPTCHA v3 reset:** `widget.reset()` clears the cached token but is otherwise a no-op — there is no stateful widget to reset.

See [docs/compatibility.md](./docs/compatibility.md) for detailed notes, known caveats, and provider recommendations.

---

## Quick start

```bash
pnpm add @captigo/core @captigo/turnstile @captigo/react
```

```tsx
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/react";

// Create the adapter once — outside the component to keep the widget stable.
const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });

export function LoginForm() {
  return (
    <form onSubmit={handleSubmit}>
      <Captcha adapter={adapter} onSuccess={(token) => setToken(token.value)} />
      <button type="submit">Log in</button>
    </form>
  );
}
```

On the server:

```ts
import { verifyToken } from "@captigo/turnstile";

const result = await verifyToken(token, process.env.TURNSTILE_SECRET!);
if (!result.success) return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
```

Swap `turnstile(...)` for `hcaptcha(...)` or `recaptchaV2(...)` — nothing else changes.

## Design

Every provider implements the `CaptchaAdapter` interface from `@captigo/core`. Your application code only ever depends on the interface, not the provider:

```
@captigo/core (types & contracts)
    ↑
    │  implements CaptchaAdapter
    ├── @captigo/turnstile
    ├── @captigo/hcaptcha
    └── @captigo/recaptcha

    ↑  consumes CaptchaAdapter
    ├── @captigo/react
    ├── @captigo/vue
    └── @captigo/nextjs  (server-side route handler helpers)
```

Configuring a different provider is a one-line change at the call site. Framework integration code is unchanged.

## Documentation

- **[Getting started](./docs/getting-started.md)** — installation, quick starts for React and Vue
- **[Supported providers](./docs/providers.md)** — Turnstile, hCaptcha, reCAPTCHA v2/v3 configuration
- **[Framework integrations](./docs/frameworks.md)** — React hooks, Vue composables, invisible widgets
- **[Server-side verification](./docs/server-verification.md)** — how to verify tokens safely
- **[Compatibility reference](./docs/compatibility.md)** — feature matrix, per-provider caveats, and recommendations
- **[Architecture](./docs/architecture.md)** — design decisions and internal structure

## Examples

Runnable examples using workspace packages:

- [`examples/react-turnstile`](./examples/react-turnstile) — Vite + React, managed and invisible widgets
- [`examples/vue-turnstile`](./examples/vue-turnstile) — Vite + Vue 3, same patterns
- [`examples/server-verify`](./examples/server-verify) — Express server verifying tokens from all providers

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
