# Example: React + Cloudflare Turnstile

A minimal Vite + React app demonstrating both a managed (visible checkbox) and invisible Turnstile widget using `@captigo/react` and `@captigo/turnstile`.

## Running

```bash
# From the repo root
pnpm install
pnpm --filter @captigo-examples/react-turnstile dev
```

Open http://localhost:5173.

## Configuration

The example uses Cloudflare's [test site key](https://developers.cloudflare.com/turnstile/reference/testing/) (`1x00000000000000000000AA`) by default, which always passes.

To use your own site key, create `examples/react-turnstile/.env.local`:

```
VITE_TURNSTILE_SITE_KEY=your_site_key_here
```

## What this shows

- `<Captcha adapter={managedAdapter} onSuccess={handleToken} />` — the simplest integration, fires automatically
- `captchaRef.current.execute("action")` — invisible mode with imperative execution on form submit
- Adapter created outside the component to prevent remounts
- Server-side verification is shown conceptually; see [`../server-verify`](../server-verify) for an actual implementation
