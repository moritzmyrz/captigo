# @captigo/vue

> Vue 3 composables and components for [Captigo](https://github.com/moritzmyrz/captigo).

Swap providers without changing your component tree — use `@captigo/turnstile`, `@captigo/hcaptcha`, or `@captigo/recaptcha`.

---

## Installation

```bash
npm install @captigo/vue @captigo/turnstile
```

`@captigo/core` is installed transitively via the adapter. **Peer dependency:** `vue` **≥ 3.3**.

---

## Quick start

### Managed widget (visible checkbox)

The most common case. The widget renders automatically; you read the token reactively.

```vue
<script setup lang="ts">
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/vue";

// Create the adapter once — outside the component or via computed() to
// avoid unnecessary widget remounts on every reactive update.
const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });

function onToken(token) {
  // Forward token.value to your server for verification.
  console.log(token.value);
}
</script>

<template>
  <form @submit.prevent="submitForm">
    <Captcha :adapter="adapter" @success="onToken" />
    <button type="submit">Submit</button>
  </form>
</template>
```

### Invisible widget (interactive / execute on submit)

For invisible Turnstile or invisible hCaptcha, call `execute()` on form submit to trigger the challenge imperatively.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/vue";
import type { CaptchaInstance } from "@captigo/vue";

const adapter = turnstile({
  siteKey: "0x4AAAAAAAxxx",
  execution: "execute", // invisible mode
});

const captchaRef = ref<CaptchaInstance>();

async function handleSubmit() {
  const token = await captchaRef.value!.execute("login");
  await fetch("/api/login", {
    method: "POST",
    body: JSON.stringify({ token: token.value }),
  });
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <Captcha ref="captchaRef" :adapter="adapter" />
    <button type="submit">Log in</button>
  </form>
</template>
```

---

## `useCaptcha` composable

For when you need lower-level control or want to integrate with your own markup.

```vue
<script setup lang="ts">
import { turnstile } from "@captigo/turnstile";
import { useCaptcha } from "@captigo/vue";

const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });

const { containerRef, token, execute, reset } = useCaptcha(adapter, {
  onSuccess: (t) => console.log("solved:", t.value),
  onExpire: () => console.log("token expired"),
  onError: (err) => console.error("widget error:", err),
});
</script>

<template>
  <div>
    <!-- Attach containerRef to the element that should host the widget. -->
    <div :ref="containerRef" class="my-captcha" />

    <!-- token is reactive — use it directly in templates or computed(). -->
    <p v-if="token">Token ready: {{ token.value }}</p>

    <button @click="execute('checkout')">Verify</button>
    <button @click="reset">Reset</button>
  </div>
</template>
```

### Reactive adapter

`useCaptcha` accepts a plain value, a `Ref`, or a getter function for the adapter. Changing the adapter destroys the old widget and mounts a new one automatically.

```ts
const selectedProvider = ref<"turnstile" | "hcaptcha">("turnstile");

const adapter = computed(() =>
  selectedProvider.value === "turnstile"
    ? turnstile({ siteKey: "..." })
    : hcaptcha({ siteKey: "..." }),
);

const { containerRef, token, execute } = useCaptcha(adapter);
```

---

## Server-side verification

Never trust tokens on the client. Validate them on your server before acting on them.

```ts
// server.ts (Node.js / edge)
import { verifyToken } from "@captigo/turnstile";

const result = await verifyToken(token, process.env.TURNSTILE_SECRET_KEY!);

if (!result.success) {
  throw new Error("CAPTCHA verification failed");
}
```

See each provider package (`@captigo/turnstile`, `@captigo/hcaptcha`, `@captigo/recaptcha`) for provider-specific verification functions and options.

---

## API reference

### `<Captcha>` component

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `adapter` | `CaptchaAdapter` | Yes | Provider adapter (e.g. from `@captigo/turnstile`) |
| `onSuccess` | `(token: CaptchaToken) => void` | No | Called when a token is produced |
| `onError` | `(error: CaptchaError) => void` | No | Called on an unrecoverable widget error |
| `onExpire` | `() => void` | No | Called when the current token expires |

Extra attributes (`id`, `class`, `style`, etc.) fall through to the underlying container `<div>` automatically.

**`CaptchaInstance`** (accessed via template ref):

| Method | Description |
|--------|-------------|
| `execute(action?)` | Trigger the challenge. Returns `Promise<CaptchaToken>`. |
| `reset()` | Reset the widget to its initial unsolved state. |
| `getToken()` | Returns the current `CaptchaToken` or `null`. |

### `useCaptcha(adapter, options?)`

| Parameter | Type | Description |
|-----------|------|-------------|
| `adapter` | `MaybeRefOrGetter<CaptchaAdapter>` | Provider adapter — can be a plain value, `Ref`, or getter |
| `options.onSuccess` | `(token) => void` | Success callback |
| `options.onError` | `(error) => void` | Error callback |
| `options.onExpire` | `() => void` | Expiry callback |

Returns `{ containerRef, token, execute, reset }`.

| Return | Type | Description |
|--------|------|-------------|
| `containerRef` | `Ref<HTMLDivElement \| null>` | Bind to the widget container element |
| `token` | `Ref<CaptchaToken \| null>` | The current token, reactive |
| `execute` | `(action?) => Promise<CaptchaToken>` | Trigger the challenge |
| `reset` | `() => void` | Reset and clear token |

---

## Notes

### Adapter identity and remounts

The widget is remounted when the resolved adapter value changes. If you construct the adapter inside a `computed()` that re-runs frequently, the widget will remount each time. Keep adapters stable:

```ts
// Good — created once
const adapter = turnstile({ siteKey: "..." });

// Fine — computed with stable inputs
const adapter = computed(() => turnstile({ siteKey: props.siteKey }));

// Avoid — new object on every reactive update
const adapter = turnstile({ siteKey: reactiveValue.value }); // inside setup()
```

### Passive providers (reCAPTCHA v3)

Score-based providers don't render a visible widget. The `<Captcha>` component still mounts an empty container; the adapter uses it to initialize. You can hide it with CSS or use `useCaptcha` and skip rendering `containerRef` entirely (call `execute()` to get the token on demand).

### Vue Strict Mode

`@captigo/vue` is compatible with Vue's production build. No special handling is needed for development strict mode since Vue 3 does not remount components the way React Strict Mode does.

---

## Documentation

- [Getting started](https://github.com/moritzmyrz/captigo/blob/main/docs/getting-started.md)
- [Framework integrations](https://github.com/moritzmyrz/captigo/blob/main/docs/frameworks.md)
- [Server-side verification](https://github.com/moritzmyrz/captigo/blob/main/docs/server-verification.md)

[@captigo/turnstile](https://github.com/moritzmyrz/captigo/blob/main/packages/turnstile/README.md) · [Repository](https://github.com/moritzmyrz/captigo) · [Issues](https://github.com/moritzmyrz/captigo/issues)
