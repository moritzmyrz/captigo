# Example: Server-side verification

A minimal Express server demonstrating token verification for all three supported providers (Turnstile, hCaptcha, reCAPTCHA v2/v3).

## Running

```bash
# From the repo root
pnpm install
pnpm --filter @captigo-examples/server-verify dev
```

## Endpoints

| Method | Path | Body |
|--------|------|------|
| POST | `/verify/turnstile` | `{ token: string }` |
| POST | `/verify/hcaptcha` | `{ token: string }` |
| POST | `/verify/recaptcha-v2` | `{ token: string }` |
| POST | `/verify/recaptcha-v3` | `{ token: string, minScore?: number }` |

## Testing with curl

The example uses provider test keys by default:

```bash
# Turnstile — the test secret key always passes
curl -X POST http://localhost:3000/verify/turnstile \
  -H "Content-Type: application/json" \
  -d '{"token":"XXXX.DUMMY.TOKEN.XXXX"}'
```

## Configuration

Set real secret keys via environment variables:

```bash
TURNSTILE_SECRET=your_secret
HCAPTCHA_SECRET=your_secret
RECAPTCHA_V2_SECRET=your_secret
RECAPTCHA_V3_SECRET=your_secret
```

## What this shows

- How to call `verifyToken` / `verifyV2Token` / `verifyV3Token` in a real server context
- Error handling with `CaptchaError` for structured error responses
- Passing `remoteip` to Turnstile for improved fraud signals
- Score threshold check for reCAPTCHA v3
