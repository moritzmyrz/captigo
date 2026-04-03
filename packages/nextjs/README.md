# @captigo/nextjs

Next.js helpers for [captigo](https://github.com/moritzmyrz/captigo) — token extraction, client IP resolution, and one-call route handler verification.

Works with any captigo adapter: Turnstile, hCaptcha, reCAPTCHA v2/v3, or a custom provider.

---

## Installation

```bash
pnpm add @captigo/nextjs @captigo/turnstile
# or: pnpm add @captigo/nextjs @captigo/hcaptcha
```

---

## App Router — route handler

The most common pattern: a POST endpoint that receives the token from a form and verifies it before taking any action.

```ts
// app/api/submit/route.ts
import { verifyCaptchaFromRequest, CaptchaError } from "@captigo/nextjs";
import { turnstile } from "@captigo/turnstile";

const adapter = turnstile({ siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! });

export async function POST(request: Request) {
  let result;
  try {
    result = await verifyCaptchaFromRequest(
      request,
      adapter,
      process.env.TURNSTILE_SECRET!,
    );
  } catch (err) {
    if (err instanceof CaptchaError) {
      // Token was missing from the body, or the provider network call failed.
      return Response.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  if (!result.success) {
    return Response.json({ error: "CAPTCHA verification failed" }, { status: 400 });
  }

  // Token is verified — proceed with the protected action.
  return Response.json({ ok: true });
}
```

> **Note on field names.** `verifyCaptchaFromRequest` looks for a `"token"` field by default. If your form uses a different name (e.g. `"cf-turnstile-response"` from Turnstile's auto-injected hidden input), pass it via `options.fieldName`.

---

## Client-side (App Router)

Use `@captigo/react` and `@captigo/turnstile` on the client as usual. No changes are needed — `@captigo/nextjs` is a server-only package.

```tsx
// app/contact/page.tsx
"use client";
import { Captcha } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";
import { useState } from "react";

const adapter = turnstile({ siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! });

export default function ContactPage() {
  const [token, setToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, message: "Hello" }),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Captcha adapter={adapter} onSuccess={(t) => setToken(t.value)} />
      <button type="submit" disabled={!token}>Send</button>
    </form>
  );
}
```

---

## API

### `verifyCaptchaFromRequest(request, adapter, secretKey, options?)`

Extracts the CAPTCHA token from the request body, resolves the client IP from standard headers, and calls `adapter.verify()`.

```ts
import { verifyCaptchaFromRequest } from "@captigo/nextjs";

const result = await verifyCaptchaFromRequest(request, adapter, secretKey, {
  fieldName: "token",   // default — the body field that holds the token
  forwardIp: true,      // default — passes client IP to the provider
});
```

**Throws** `CaptchaError` when:
- The token field is absent from the request body.
- The provider's network request fails.

**Returns** `VerifyResult` — check `result.success` to decide whether to accept the submission.

---

### `captchaTokenFromRequest(request, fieldName?)`

Extracts the raw token string from a request body. Tries JSON first, then FormData/URL-encoded. Returns `null` when the field is absent or empty — never throws on parse failure.

```ts
import { captchaTokenFromRequest } from "@captigo/nextjs";

// Use this when you need the token separately before calling adapter.verify().
const token = await captchaTokenFromRequest(request, "cf-turnstile-response");
if (!token) {
  return Response.json({ error: "Missing CAPTCHA token" }, { status: 400 });
}

const result = await adapter.verify(token, process.env.TURNSTILE_SECRET!);
```

---

### `clientIpFromRequest(request)`

Resolves the client IP from standard CDN and proxy headers. Checks in order:

1. `CF-Connecting-IP` (Cloudflare)
2. `X-Forwarded-For` (first address in the list)
3. `X-Real-IP` (nginx)

Returns `undefined` when none are present.

```ts
import { clientIpFromRequest } from "@captigo/nextjs";

const ip = clientIpFromRequest(request);
const result = await adapter.verify(token, secretKey, ip ? { remoteip: ip } : undefined);
```

---

## Server Actions

`verifyCaptchaFromRequest` expects a `Request` object. Server Actions receive form data directly, not a `Request`, so use `captchaTokenFromRequest` with the raw FormData instead — or verify via a route handler.

```ts
// app/actions.ts
"use server";
import { CaptchaError } from "@captigo/nextjs";
import { turnstile } from "@captigo/turnstile";

const adapter = turnstile({ siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! });

export async function submitAction(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    throw new Error("Missing CAPTCHA token");
  }

  const result = await adapter.verify(token, process.env.TURNSTILE_SECRET!);
  if (!result.success) {
    throw new Error("CAPTCHA verification failed");
  }

  // ... proceed
}
```

---

## Notes

- **No `next` runtime dependency.** The helpers work with the standard Web `Request` API (available natively in Next.js App Router and Node.js 18+).
- **Server-only.** Never call `adapter.verify()` or expose your secret key on the client.
- **Provider-agnostic.** Pass any captigo adapter — `turnstile(config)`, `hcaptcha(config)`, `recaptchaV2(config)`, etc.
