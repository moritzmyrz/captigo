# @captigo/hcaptcha

> hCaptcha adapter for [captigo](https://github.com/moritzmyrz/captigo).

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

## Notable differences from Turnstile

- `execute()` is a void trigger in invisible mode — the token arrives via the
  `onSuccess` callback and the promise resolves from that same callback path.
- hCaptcha has a `chalexpired-callback` that fires when an invisible challenge
  closes without being solved. Any pending `execute()` promises are rejected.
- hCaptcha does not support per-execute action labels (the `action` parameter
  in `widget.execute(action?)` is ignored).
- The verify endpoint is `https://api.hcaptcha.com/siteverify`.

---

## Links

- [hCaptcha docs](https://docs.hcaptcha.com/)
- [captigo monorepo](https://github.com/moritzmyrz/captigo)
