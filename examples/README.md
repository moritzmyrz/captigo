# Examples

Small, runnable apps that mirror how Captigo is meant to be used: stable adapters, real form flows, and server verification where it matters.

## Index

| Example | Stack | What it demonstrates |
|--------|--------|----------------------|
| [`react-turnstile`](./react-turnstile) | Vite + React | Managed + invisible Turnstile widgets side by side |
| [`react-signup-turnstile`](./react-signup-turnstile) | Vite + React | Signup-shaped form: validation, CAPTCHA gate, payload you’d POST |
| [`react-contact-server`](./react-contact-server) | Vite + React + Express | **End-to-end:** contact form → `verifyToken` on the server |
| [`vue-turnstile`](./vue-turnstile) | Vite + Vue 3 | Same widget patterns as `react-turnstile` |
| [`vue-form-turnstile`](./vue-form-turnstile) | Vite + Vue 3 | Contact form; optional live API via `VITE_CONTACT_API_BASE` |
| [`react-provider-swap`](./react-provider-swap) | Vite + React | Turnstile vs hCaptcha from one `CaptchaAdapter` factory |
| [`react-recaptcha-v3`](./react-recaptcha-v3) | Vite + React | Passive v3: `execute()`, token client-side, **score server-side** |
| [`server-verify`](./server-verify) | Express | Minimal `/verify/*` routes for Turnstile, hCaptcha, reCAPTCHA |

## Run

```bash
pnpm install   # from repo root

pnpm --filter @captigo-examples/react-signup-turnstile dev
pnpm --filter @captigo-examples/react-contact-server dev
pnpm --filter @captigo-examples/vue-form-turnstile dev
# … see each example’s README
```

All use `workspace:*` — no publish step required.

## Recommended reading

- [Server-side verification](../docs/server-verification.md)
- [Compatibility / provider notes](../docs/compatibility.md)
