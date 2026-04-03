# React: swap CAPTCHA provider

Minimal app showing **one form** and a **factory** that returns either Turnstile or hCaptcha — both are `CaptchaAdapter`s, so JSX stays identical.

## What this demonstrates

- Central `createCaptchaAdapter(provider)` — swap here (env flag, remote config, A/B test).
- **Remount** the widget when the adapter changes (`key={provider}` on `<Captcha />`).
- Server code must use the matching secret (`TURNSTILE_SECRET` vs `HCAPTCHA_SECRET`).

## Run

```bash
pnpm --filter @captigo-examples/react-provider-swap dev
```

Optional: `VITE_CAPTCHA_PROVIDER=hcaptcha` or `turnstile` for the initial radio selection.

Defaults use each vendor’s **test / pass** site keys from Cloudflare and hCaptcha docs.
