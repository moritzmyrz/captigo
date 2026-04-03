# @captigo/recaptcha

> Google reCAPTCHA v2 and v3 adapter for [captigo](https://github.com/moritzmyrz/captigo).

This package provides two separate factory functions — `recaptchaV2` and
`recaptchaV3` — because v2 and v3 are fundamentally different in how they work:

| | reCAPTCHA v2 | reCAPTCHA v3 |
|---|---|---|
| Widget | Visible checkbox (or invisible) | None — pure JS call |
| User interaction | Required (or invisible with `execute()`) | None |
| Token | One-time, expires after ~2 min | Fresh per call, includes a score |
| Mode | `"managed"` or `"interactive"` | `"passive"` |
| `requiresContainer` | `true` | `false` |

---

## Installation

```bash
npm install @captigo/core @captigo/recaptcha
```

(`@captigo/core` is also installed automatically as a dependency — listing it explicitly is optional.)

---

## reCAPTCHA v2

### Checkbox (visible) widget

```ts
import { recaptchaV2 } from "@captigo/recaptcha";

const adapter = recaptchaV2({ siteKey: "6Lc..." });

const widget = adapter.render(container, {
  callbacks: {
    onSuccess: (token) => setToken(token.value),
    onExpire: () => setToken(null),
  },
});

widget.destroy(); // on cleanup
```

### Invisible widget

```ts
const adapter = recaptchaV2({ siteKey: "6Lc...", size: "invisible" });

// adapter.meta.mode === "interactive"

const widget = adapter.render(container, { callbacks: { onSuccess: setToken } });

// On form submit:
const token = await widget.execute();
```

### Server-side verification (v2)

```ts
const result = await adapter.verify(token, process.env.RECAPTCHA_SECRET!);
if (!result.success) {
  return Response.json({ error: "CAPTCHA failed" }, { status: 400 });
}
```

### v2 configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `siteKey` | `string` | — | **Required.** |
| `size` | `"checkbox" \| "compact" \| "invisible"` | `"checkbox"` | Widget variant. |
| `theme` | `"light" \| "dark"` | `"light"` | Color scheme. |
| `badge` | `"bottomright" \| "bottomleft" \| "inline"` | `"bottomright"` | Badge position for invisible mode. |
| `language` | `string` | browser default | Language override (e.g. `"en"`). |
| `tabindex` | `number` | — | Tab index. |

---

## reCAPTCHA v3

v3 is passive — no widget is shown. Call `widget.execute(action)` to receive
a risk score from Google. You decide whether to accept or reject based on it.

```ts
import { recaptchaV3 } from "@captigo/recaptcha";

const adapter = recaptchaV3({ siteKey: "6Lc...", action: "login" });

// adapter.meta.mode === "passive"
// adapter.meta.requiresContainer === false — pass any element, it's ignored

const widget = adapter.render(document.body, {
  callbacks: {
    onSuccess: (token) => submitForm(token.value),
  },
});

// On form submit — each call fetches a fresh token:
const token = await widget.execute("login");
await fetch("/api/login", {
  body: JSON.stringify({ captcha: token.value }),
});
```

### Server-side verification (v3)

```ts
import { verifyV3Token } from "@captigo/recaptcha";
// or: const result = await adapter.verify(token, secret);

const result = await verifyV3Token(token, process.env.RECAPTCHA_SECRET!);

if (!result.success || (result.score ?? 0) < 0.5) {
  return Response.json({ error: "Suspicious request" }, { status: 403 });
}

// Always verify the action matches what you expected:
if (result.action !== "login") {
  return Response.json({ error: "Action mismatch" }, { status: 400 });
}
```

`verifyV3Token` returns a `ReCaptchaV3VerifyResult` which extends `VerifyResult`
with two additional fields:

| Field | Type | Description |
|---|---|---|
| `score` | `number` | 0.0 (bot) – 1.0 (human). |
| `action` | `string` | The action Google recorded. Cross-check with your expected value. |

### v3 configuration

| Option | Type | Default | Description |
|---|---|---|---|
| `siteKey` | `string` | — | **Required.** |
| `action` | `string` | `"default"` | Default action label. Can be overridden per `execute(action)` call. |

---

## Important notes

### reCAPTCHA v2 has no `remove()` API

Calling `widget.destroy()` resets the widget but cannot fully remove it from
the DOM. If you need to remove the widget, remove the container element itself.

### v3 scores are advisory

Google's v3 score is a signal, not a verdict. The right threshold depends on
your application — `0.5` is a common starting point. Review the reCAPTCHA
admin console to tune this.

### Secret key security

Never expose your `RECAPTCHA_SECRET` in client-side code. Only call `verify()`
from your server.

---

## Links

- [reCAPTCHA v2 docs](https://developers.google.com/recaptcha/docs/display)
- [reCAPTCHA v3 docs](https://developers.google.com/recaptcha/docs/v3)
- [captigo monorepo](https://github.com/moritzmyrz/captigo)
