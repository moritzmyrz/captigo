# Example: Vue 3 + Cloudflare Turnstile

A minimal Vite + Vue 3 app demonstrating both a managed (visible checkbox) and invisible Turnstile widget using `@captigo/vue` and `@captigo/turnstile`.

## Running

```bash
# From the repo root
pnpm install
pnpm --filter @captigo-examples/vue-turnstile dev
```

Open http://localhost:5173.

## Configuration

The example uses Cloudflare's [test site key](https://developers.cloudflare.com/turnstile/reference/testing/) (`1x00000000000000000000AA`) by default, which always passes.

To use your own site key, create `examples/vue-turnstile/.env.local`:

```
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

## What this shows

- `<Captcha :adapter="managedAdapter" @success="onToken" />` — the simplest integration
- `captchaRef.value.execute("action")` — invisible mode with imperative execution via `CaptchaInstance`
- Adapters created at module scope (outside `setup()`) to prevent remounts
- `@captigo/vue`'s attribute fallthrough — `class`, `style`, `id`, etc. flow through to the container div
