# @captigo/react

> React 18+ hooks and components for [Captigo](https://github.com/moritzmyrz/captigo).

Provider-agnostic widgets: pass any `CaptchaAdapter` from `@captigo/turnstile`, `@captigo/hcaptcha`, or `@captigo/recaptcha`.

---

## Installation

```bash
npm install @captigo/react @captigo/turnstile
```

`@captigo/core` is installed transitively via the adapter. **Peer dependencies:** `react` and `react-dom` **18+**.

---

## Quick start

### Managed widget (visible, fires automatically)

For most use cases you just need the `<Captcha>` component. Create an adapter
from your provider package and pass it as a prop — the component handles the
full mount/unmount lifecycle.

```tsx
import { Captcha } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";
import { useState } from "react";

// Create the adapter once, outside the component.
const adapter = turnstile({ siteKey: "0x4AAAAAAA..." });

export function ContactForm() {
  const [token, setToken] = useState<string | null>(null);

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!token) return;
      submitForm(token);
    }}>
      <input name="email" type="email" />

      <Captcha
        adapter={adapter}
        onSuccess={(t) => setToken(t.value)}
        onExpire={() => setToken(null)}
      />

      <button type="submit" disabled={!token}>
        Send
      </button>
    </form>
  );
}
```

---

### Interactive / invisible widget

For invisible CAPTCHAs (e.g. Turnstile with `execution: "execute"`), use a
`ref` to get the `CaptchaHandle` and call `execute()` imperatively on submit.

```tsx
import { Captcha } from "@captigo/react";
import type { CaptchaHandle } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";
import { useRef } from "react";

const adapter = turnstile({
  siteKey: "0x4AAAAAAA...",
  execution: "execute", // invisible widget
});

export function LoginForm() {
  const captchaRef = useRef<CaptchaHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Triggers the invisible challenge; resolves when done.
    const token = await captchaRef.current!.execute("login");

    await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ token: token.value, ...formData }),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" />
      <input name="password" type="password" />

      {/* Invisible widget — renders nothing visible */}
      <Captcha ref={captchaRef} adapter={adapter} />

      <button type="submit">Log in</button>
    </form>
  );
}
```

---

### Error and expiry handling

Use `onError` and `onExpire` to keep the UI in sync with the widget state.
`onExpire` fires both when an issued token expires and when the challenge
presentation times out.

```tsx
<Captcha
  adapter={adapter}
  onSuccess={(t) => setToken(t.value)}
  onError={(err) => {
    console.error(err.code, err.message);
    setStatus("The CAPTCHA failed. Please try again.");
  }}
  onExpire={() => {
    setToken(null);
    setStatus("Token expired. Please complete the challenge again.");
  }}
/>
```

---

### `useCaptcha` hook

Use the hook when you need direct access to the container ref (e.g. custom
layouts) or want the token in component state without the `<Captcha>` wrapper.

```tsx
import { useCaptcha } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";

const adapter = turnstile({ siteKey: "0x4AAAAAAA..." });

export function CheckoutWidget() {
  const { containerRef, token, execute, reset } = useCaptcha(adapter, {
    onSuccess: (t) => console.log("Token:", t.value),
    onExpire: () => console.log("Token expired"),
  });

  return (
    <div>
      {/* Attach this ref to any div — the widget renders into it. */}
      <div ref={containerRef} />

      <p>{token ? "✓ Verified" : "Solve the challenge above"}</p>

      <button onClick={() => execute("checkout")} disabled={!!token}>
        Trigger challenge
      </button>

      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

---

## Server-side verification

Displaying a CAPTCHA is only half of the story — you must verify the token
server-side before trusting it. This step is handled by the provider adapter,
not by this React package.

```ts
// In an API route / server action:
import { adapter } from "./captcha.js"; // your shared adapter instance

export async function POST(request: Request) {
  const { token } = await request.json() as { token: string };

  const result = await adapter.verify(token, process.env.TURNSTILE_SECRET!);
  if (!result.success) {
    return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
  }

  // Process the verified request...
}
```

See the [`@captigo/turnstile` README](https://github.com/moritzmyrz/captigo/blob/main/packages/turnstile/README.md) for provider-specific verification options.

For Next.js App Router route handlers, consider [`@captigo/nextjs`](https://github.com/moritzmyrz/captigo/blob/main/packages/nextjs/README.md).

---

## API reference

### `<Captcha>`

```tsx
<Captcha
  adapter={adapter}           // required: any CaptchaAdapter
  onSuccess={(token) => {}}   // called with CaptchaToken when solved
  onError={(err) => {}}       // called with CaptchaError on failure
  onExpire={() => {}}         // called when the token expires
  className="..."             // forwarded to the container <div>
  style={{...}}               // forwarded to the container <div>
  id="my-captcha"             // forwarded to the container <div>
  ref={captchaRef}            // optional: attach for imperative control
/>
```

#### `CaptchaHandle` (ref)

When a `ref` is attached, you get access to:

| Method | Description |
|---|---|
| `execute(action?)` | Trigger the challenge. Returns `Promise<CaptchaToken>`. |
| `reset()` | Reset to unsolved state. |
| `getToken()` | Returns the current `CaptchaToken \| null`. |

---

### `useCaptcha(adapter, options?)`

```ts
const { containerRef, token, execute, reset } = useCaptcha(adapter, {
  onSuccess?: (token: CaptchaToken) => void,
  onError?: (error: CaptchaError) => void,
  onExpire?: () => void,
});
```

**Returns:**

| Property | Type | Description |
|---|---|---|
| `containerRef` | `RefObject<HTMLDivElement>` | Attach to the widget container `<div>`. |
| `token` | `CaptchaToken \| null` | Current token. Triggers re-render on change. |
| `execute` | `(action?) => Promise<CaptchaToken>` | Trigger the challenge. |
| `reset` | `() => void` | Reset to unsolved state and clear the token. |

---

## Important notes

### Adapter identity

The adapter is used as the dependency in a `useEffect`. If you create the
adapter inline inside a component, a new adapter is created on every render,
which causes the widget to be destroyed and remounted on every render.

```tsx
// ✗ Bad — new adapter on every render
function Form() {
  return <Captcha adapter={turnstile({ siteKey: "..." })} />;
}

// ✓ Good — stable adapter outside the component
const adapter = turnstile({ siteKey: "..." });
function Form() {
  return <Captcha adapter={adapter} />;
}

// ✓ Also good — useMemo for dynamic configs
function Form({ siteKey }: { siteKey: string }) {
  const adapter = useMemo(() => turnstile({ siteKey }), [siteKey]);
  return <Captcha adapter={adapter} />;
}
```

### Callback identity

Unlike the adapter, `onSuccess`, `onError`, and `onExpire` callbacks can be
passed as inline functions — they are stored in a ref internally and will not
cause widget remounts.

### React Strict Mode

The package is compatible with React Strict Mode. In development, effects run
twice; the widget is destroyed and remounted, which is expected and harmless.

---

## Documentation

- [Getting started](https://github.com/moritzmyrz/captigo/blob/main/docs/getting-started.md)
- [Framework integrations](https://github.com/moritzmyrz/captigo/blob/main/docs/frameworks.md)
- [Server-side verification](https://github.com/moritzmyrz/captigo/blob/main/docs/server-verification.md)

[@captigo/turnstile](https://github.com/moritzmyrz/captigo/blob/main/packages/turnstile/README.md) · [Repository](https://github.com/moritzmyrz/captigo) · [Issues](https://github.com/moritzmyrz/captigo/issues)
