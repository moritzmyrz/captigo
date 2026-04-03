# Framework Integrations

Captigo's framework packages are thin wrappers that bind the provider adapter lifecycle to the framework's component model. They do not know which provider is underneath — all provider-specific logic stays in the adapter.

---

## React — `@captigo/react`

### Installation

```bash
pnpm add @captigo/core @captigo/react @captigo/turnstile  # or any other provider
```

### `<Captcha>` component

The simplest way to add a CAPTCHA to a form. Handles mount, unmount, and cleanup automatically.

```tsx
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/react";

// Create the adapter outside the component (or in useMemo) to prevent
// the widget from remounting on every render.
const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });

function SignupForm() {
  return (
    <form onSubmit={handleSubmit}>
      <Captcha
        adapter={adapter}
        onSuccess={(token) => setToken(token.value)}
        onError={(err) => console.error(err)}
        onExpire={() => setToken(null)}
        className="my-captcha"
        id="signup-captcha"
      />
      <button type="submit">Sign up</button>
    </form>
  );
}
```

### Invisible widget with `CaptchaHandle`

For invisible/interactive providers, call `execute()` programmatically on form submit.

```tsx
import { useRef } from "react";
import type { CaptchaHandle } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/react";

const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx", execution: "execute" });

function CheckoutForm() {
  const captchaRef = useRef<CaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await captchaRef.current!.execute("checkout");
    await placeOrder(token.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Captcha ref={captchaRef} adapter={adapter} onSuccess={setToken} />
      <button type="submit">Place order</button>
    </form>
  );
}
```

### `useCaptcha` hook

For full control over rendering and positioning.

```tsx
import { useCaptcha } from "@captigo/react";

function LoginForm() {
  const { containerRef, token, execute, reset } = useCaptcha(adapter, {
    onSuccess: (t) => setToken(t.value),
    onExpire: () => setToken(null),
  });

  return (
    <div>
      {/* Attach containerRef to any div — the widget renders inside it */}
      <div ref={containerRef} />
      <button onClick={() => execute("login")}>Verify</button>
    </div>
  );
}
```

### Important notes

**Adapter identity:** The widget remounts whenever `adapter` changes by reference. Keep adapters stable:
```ts
// Good — created once per module
const adapter = turnstile({ siteKey: "..." });

// Good — stable reference
const adapter = useMemo(() => turnstile({ siteKey }), [siteKey]);

// Bad — new object every render (causes constant remounts)
function Component() {
  const adapter = turnstile({ siteKey: "..." }); // inside render
}
```

**React Strict Mode:** In development, React Strict Mode mounts components twice to detect side effects. Captigo handles this correctly — the widget will be destroyed and re-created, and the second creation will work normally.

---

## Vue 3 — `@captigo/vue`

### Installation

```bash
pnpm add @captigo/core @captigo/vue @captigo/turnstile
```

### `<Captcha>` component

```vue
<script setup lang="ts">
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/vue";

// Create the adapter outside setup() or in computed() to avoid remounts.
const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx" });
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <Captcha
      :adapter="adapter"
      @success="onToken"
      @error="onError"
      @expire="onExpire"
      class="my-captcha"
    />
    <button type="submit">Submit</button>
  </form>
</template>
```

### Invisible widget with `CaptchaInstance`

```vue
<script setup lang="ts">
import { ref } from "vue";
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/vue";
import type { CaptchaInstance } from "@captigo/vue";

const adapter = turnstile({ siteKey: "0x4AAAAAAAxxx", execution: "execute" });
const captchaRef = ref<CaptchaInstance>();

async function handleSubmit() {
  const token = await captchaRef.value!.execute("checkout");
  await placeOrder(token.value);
}
</script>

<template>
  <Captcha ref="captchaRef" :adapter="adapter" @success="onToken" />
</template>
```

### `useCaptcha` composable

```ts
import { computed } from "vue";
import { turnstile } from "@captigo/turnstile";
import { useCaptcha } from "@captigo/vue";

// adapter can be a plain value, Ref, or getter — any change remounts the widget
const adapter = computed(() => turnstile({ siteKey: props.siteKey }));

const { containerRef, token, execute, reset } = useCaptcha(adapter, {
  onSuccess: (t) => (submittedToken.value = t.value),
});
```

```vue
<template>
  <div :ref="containerRef" />
  <p v-if="token">Token: {{ token.value }}</p>
</template>
```

### Key differences from React

- No `useCallback` / memoization needed — composable functions are stable by default.
- `adapter` accepts `MaybeRefOrGetter<CaptchaAdapter>` (plain value, `Ref`, or getter). Vue's reactivity tracks changes automatically.
- `wrapper.vm` (in tests) gives the exposed interface directly — no separate handle ref type needed.

---

## Passive providers (reCAPTCHA v3)

reCAPTCHA v3 is score-based and does not render any visible widget. The component still mounts an empty div, but you call `execute()` to get a token rather than waiting for user interaction.

```tsx
// React example
import { recaptchaV3 } from "@captigo/recaptcha";

const adapter = recaptchaV3({ siteKey: "...", action: "login" });

function LoginForm() {
  const captchaRef = useRef<CaptchaHandle>(null);

  const handleSubmit = async () => {
    // execute() fires immediately — no user prompt
    const token = await captchaRef.current!.execute();
    await login(token.value);
  };

  return (
    <>
      {/* Hidden — v3 renders no visible widget */}
      <Captcha ref={captchaRef} adapter={adapter} style={{ display: "none" }} />
      <button onClick={handleSubmit}>Log in</button>
    </>
  );
}
```
