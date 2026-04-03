# React signup + Turnstile

Focused **client-side** example: account form fields, managed Turnstile widget, submit gated on a valid token.

## What this demonstrates

- **`CaptchaAdapter` created once** at module scope (avoids remount loops).
- **Submit disabled** until email, password length, and CAPTCHA success are satisfied.
- **`onExpire` / `onError`** clear token and user messaging — tokens are single-use and time-limited.
- **No fake “success” without a backend** — the demo ends by showing the JSON your API should accept; you must **`verifyToken` on the server** before creating an account.

## Run

```bash
pnpm --filter @captigo-examples/react-signup-turnstile dev
```

Optional: set `VITE_TURNSTILE_SITE_KEY` in `.env.local` for a real key.

## See also

- [`react-contact-server`](../react-contact-server) — Vite + Express with real `verifyToken`
- [`server-verify`](../server-verify) — verify endpoints for multiple providers
