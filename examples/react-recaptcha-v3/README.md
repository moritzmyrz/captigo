# React + reCAPTCHA v3 (score)

Passive **v3** flow: no checkbox. The browser gets a **token** via `execute()`; the **score** appears only in the **siteverify** response on your server.

## What this demonstrates

- `recaptchaV3()` with `@captigo/react` and an imperative `CaptchaHandle`.
- Clear split: client shows token shape; **thresholding happens after `verifyV3Token`** (see [`docs/server-verification.md`](../../docs/server-verification.md)).
- Test site key from Google’s FAQ — replace in production.

## Run

```bash
pnpm --filter @captigo-examples/react-recaptcha-v3 dev
```

Remember Google’s **badge / privacy policy** requirements for v3.
