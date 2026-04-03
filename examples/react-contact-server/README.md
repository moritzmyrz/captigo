# React contact form + Turnstile verification

End-to-end **browser → API → Turnstile siteverify** in a small footprint: Vite + React, Express, and `@captigo/turnstile`.

## What this demonstrates

- **Same adapter shape** as other examples: client renders the widget; server only sees the token string.
- **Proxy in development** so the React app can call `/api/contact` without CORS pain (production would use your real API host).
- **Server-side verification** with `verifyToken` and optional `remoteip` from `x-forwarded-for`.
- **Validation split**: light checks on the server for email/message; CAPTCHA failure returns `400` with provider error codes.

## Run

From the repo root (installs workspace deps once):

```bash
pnpm --filter @captigo-examples/react-contact-server dev
```

This starts Express on **8787** and Vite on **5173**. Open the URL Vite prints (usually `http://localhost:5173`).

Set `TURNSTILE_SECRET` in the environment if you use non-test keys. The default matches Cloudflare’s **always-pass** test secret used elsewhere in this repo.

## Architecture

```
Browser (Vite)  ─POST /api/contact→  Vite proxy  ─→  Express :8787
                                                          verifyToken()
```

In production, replace the proxy with your deployed API and keep **secrets only on the server**.
