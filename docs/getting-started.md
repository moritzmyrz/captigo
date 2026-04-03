# Getting Started

Captigo is a TypeScript-first library ecosystem for integrating CAPTCHA providers. You get a unified interface that works across Cloudflare Turnstile, hCaptcha, and Google reCAPTCHA — with first-class framework support for React and Vue 3.

---

## How it works

Every provider is wrapped in a `CaptchaAdapter` — a small object that holds your site key and knows how to mount a widget and verify tokens. Your application code only deals with this adapter interface; the provider-specific details stay inside the adapter package.

```
@captigo/turnstile  ─┐
@captigo/hcaptcha   ─┤──▶  CaptchaAdapter ──▶  @captigo/react
@captigo/recaptcha  ─┘                     └──▶  @captigo/vue
```

Swapping providers is one line change.

---

## Installation

Install the core package, one provider adapter, and (optionally) a framework integration:

```bash
# Cloudflare Turnstile + React
pnpm add captigo @captigo/turnstile @captigo/react

# hCaptcha + Vue 3
pnpm add captigo @captigo/hcaptcha @captigo/vue

# reCAPTCHA v2 (no framework)
pnpm add captigo @captigo/recaptcha
```

---

## Quick start: React + Turnstile

```tsx
// 1. Create the adapter once — outside the component or in useMemo.
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/react";

const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });

export function LoginForm() {
  const handleToken = async (token) => {
    // token.value is the string to send to your server.
    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ captchaToken: token.value }),
    });
  };

  return (
    <form>
      <Captcha adapter={adapter} onSuccess={handleToken} />
      <button type="submit">Log in</button>
    </form>
  );
}
```

On your server:

```ts
// 2. Verify the token before trusting it.
import { verifyToken } from "@captigo/turnstile";

const result = await verifyToken(token, process.env.TURNSTILE_SECRET!);
if (!result.success) return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
```

---

## Quick start: Vue 3 + Turnstile

```vue
<script setup lang="ts">
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/vue";

const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });

function onToken(token) {
  fetch("/api/login", { method: "POST", body: JSON.stringify({ captchaToken: token.value }) });
}
</script>

<template>
  <form>
    <Captcha :adapter="adapter" @success="onToken" />
    <button type="submit">Log in</button>
  </form>
</template>
```

---

## Next steps

- [Supported providers](./providers.md) — configuration options for each provider
- [Framework integrations](./frameworks.md) — React hooks, Vue composables, invisible widgets
- [Server-side verification](./server-verification.md) — how to verify tokens safely
- [Architecture](./architecture.md) — how captigo is designed and why
