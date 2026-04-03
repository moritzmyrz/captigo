# @captigo/hcaptcha

> hCaptcha adapter for [captigo](https://github.com/moritzmyrz/captigo).

Provides a browser-side widget lifecycle and a server-side token verification
helper behind the same `CaptchaAdapter` interface as the rest of the captigo
ecosystem.

---

## Installation

```bash
npm install @captigo/core @captigo/hcaptcha
```

(`@captigo/core` is also installed automatically as a dependency — listing it explicitly is optional.)

---

## Quick start

### 1. Create the adapter

```ts
import { hcaptcha } from "@captigo/hcaptcha";

const adapter = hcaptcha({ siteKey: "your-site-key" });
```

### 2. Client-side — render a widget

```ts
const widget = adapter.render(container, {
  callbacks: {
    onSuccess: (token) => setHiddenField(token.value),
    onExpire: () => clearField(),
    onError: (err) => console.error(err.message),
  },
});

// Cleanup on unmount:
widget.destroy();
```

### 3. Server-side — verify the token

```ts
const result = await adapter.verify(token, process.env.HCAPTCHA_SECRET!);
if (!result.success) {
  return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
}
```

---

## Invisible widget

Set `size: "invisible"` to render a hidden widget that fires when you call
`widget.execute()`:

```ts
const adapter = hcaptcha({ siteKey: "...", size: "invisible" });

// adapter.meta.mode === "interactive"

const widget = adapter.render(container, { callbacks: { onSuccess: setToken } });

// On form submit:
const token = await widget.execute();
await submitForm(token.value);
```

The `execute()` call resolves when the user completes the (possibly invisible)
challenge, or rejects if the challenge expires or errors.

---

## Configuration reference

| Option | Type | Default | Description |
|---|---|---|---|
| `siteKey` | `string` | — | **Required.** Your hCaptcha site key. |
| `size` | `"normal" \| "compact" \| "invisible"` | `"normal"` | Widget variant. `"invisible"` requires `widget.execute()`. |
| `theme` | `"light" \| "dark"` | `"light"` | Widget color scheme. |
| `language` | `string` | browser default | Language override (e.g. `"en"`, `"fr"`). |
| `endpoint` | `string` | `"https://hcaptcha.com"` | Custom endpoint for enterprise customers. |
| `tabindex` | `number` | — | Tab index for the widget iframe. |

---

## Behavior notes

- **Invisible mode:** Calling `widget.execute()` runs the challenge; the token
  is delivered to `onSuccess`, and the promise returned by `execute()` resolves
  once that happens.
- **Challenge expiry:** If an invisible challenge is dismissed or expires
  without a solve, any pending `execute()` promise is rejected.
- **`execute(action?)`:** An optional `action` string may be passed for API
  compatibility with captigo’s widget shape; hCaptcha does not use it, so it is
  ignored.
- **Server verification:** Tokens are checked with
  `https://api.hcaptcha.com/siteverify` (see `adapter.verify`).

---

## Links

- [hCaptcha docs](https://docs.hcaptcha.com/)
- [captigo monorepo](https://github.com/moritzmyrz/captigo)
