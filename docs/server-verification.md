# Server-Side Verification

Every CAPTCHA provider requires you to verify the client-submitted token on your server before taking any action. Skipping this step means your CAPTCHA provides no real protection — a token seen by the browser could be replayed or fabricated.

---

## The flow

```
Browser                            Your Server              Provider API
───────                            ───────────              ────────────
1. Widget solves challenge
2. Provider returns token ──────▶ 3. Receive token
                                   4. POST to verify ──────▶ 5. Check token
                                   6. Read result   ◀─────── 7. Return result
                                   8. Allow/reject request
```

The token is single-use and time-limited. Verify it once, immediately, and discard it.

---

## Cloudflare Turnstile

```ts
import { verifyToken } from "@captigo/turnstile";

// In your route handler / API endpoint:
const result = await verifyToken(
  submittedToken,              // from the request body
  process.env.TURNSTILE_SECRET!, // your secret key — never expose this to the browser
  { remoteip: request.headers.get("CF-Connecting-IP") ?? undefined },
);

if (!result.success) {
  return Response.json({ error: "Verification failed" }, { status: 400 });
}

// Proceed with the protected action
```

**Response shape:**

```ts
type VerifyResult = {
  success: boolean;
  provider: "turnstile";
  challengeTs?: string;  // ISO 8601 challenge timestamp
  hostname?: string;     // domain where the challenge was solved
  errorCodes?: string[]; // present when success: false
};
```

---

## hCaptcha

```ts
import { verifyToken } from "@captigo/hcaptcha";

const result = await verifyToken(submittedToken, process.env.HCAPTCHA_SECRET!);

if (!result.success) {
  return Response.json({ error: "Verification failed" }, { status: 400 });
}
```

hCaptcha also returns a `score` field for enterprise accounts. Captigo exposes it on `result.score` when present.

---

## Google reCAPTCHA v2

```ts
import { verifyV2Token } from "@captigo/recaptcha";

const result = await verifyV2Token(submittedToken, process.env.RECAPTCHA_V2_SECRET!);

if (!result.success) {
  return Response.json({ error: "Verification failed" }, { status: 400 });
}
```

---

## Google reCAPTCHA v3

reCAPTCHA v3 always returns `success: true` for valid tokens. The useful signal is the `score` (0.0–1.0, higher means more likely human). You decide the threshold.

```ts
import { verifyV3Token } from "@captigo/recaptcha";
import type { ReCaptchaV3VerifyResult } from "@captigo/recaptcha";

const result: ReCaptchaV3VerifyResult = await verifyV3Token(
  submittedToken,
  process.env.RECAPTCHA_V3_SECRET!,
);

if (!result.success || result.score < 0.5) {
  return Response.json({ error: "Suspicious activity detected" }, { status: 400 });
}
```

**v3 response shape:**

```ts
type ReCaptchaV3VerifyResult = VerifyResult & {
  score?: number;   // 0.0 (bot) to 1.0 (human)
  action?: string;  // the action label you passed to execute()
};
```

---

## Using the adapter directly

If your server already has an adapter instance (e.g. shared between client and server bundles), you can call `adapter.verify()` directly instead of importing the standalone function:

```ts
const result = await adapter.verify(token, process.env.SECRET!);
```

This is equivalent to calling the provider-specific `verifyToken` function — it is provided as a convenience for isomorphic setups.

---

## Security checklist

- **Never expose secret keys to the browser.** They must only exist in server-side environment variables.
- **Always verify on the server** — never trust a client-side `success` flag.
- **Check `hostname`** if your site runs on multiple domains — validate it matches your expected origin.
- **Verify once.** Tokens are single-use. Don't cache and reuse them.
- **Check `errorCodes`** to distinguish between network errors and deliberate failures.
- **Set `remoteip`** where available — it improves fraud detection at the provider.
