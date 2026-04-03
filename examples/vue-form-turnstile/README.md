# Vue contact form + Turnstile

A **form-first** Vue example: name, email, message, managed Turnstile, and an optional live POST to the shared Express API from [`react-contact-server`](../react-contact-server).

## What this demonstrates

- Module-scoped `CaptchaAdapter` (stable widget).
- Imperative **reset** after a successful send when talking to a real API.
- **Optional API**: without `VITE_CONTACT_API_BASE`, the app only prints the JSON you would POST — useful for static review.

## Run (UI only)

```bash
pnpm --filter @captigo-examples/vue-form-turnstile dev
```

## Run with server verification

Terminal 1 — API on port 8787:

```bash
pnpm --filter @captigo-examples/react-contact-server dev:api
```

Terminal 2 — Vue (set the API origin):

```bash
VITE_CONTACT_API_BASE=http://127.0.0.1:8787 pnpm --filter @captigo-examples/vue-form-turnstile dev
```

Complete the CAPTCHA and send; the API runs `verifyToken` like the React contact example.
