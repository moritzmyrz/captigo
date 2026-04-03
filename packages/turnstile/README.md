# @captigo/turnstile

> Cloudflare Turnstile adapter for [Captigo](https://github.com/moritzmyrz/captigo) — client widget lifecycle and server-side token verification.

Provides a browser-side widget lifecycle and a server-side token verification
helper — both behind the same `CaptchaAdapter` interface that the rest of the
captigo ecosystem uses.

---

## Installation

```bash
npm install @captigo/turnstile
```

`@captigo/core` is installed automatically as a transitive dependency. Add `@captigo/react` or `@captigo/vue` on the client if you use those integrations.

---

## Quick start

### 1. Create the adapter

```ts
import { turnstile } from "@captigo/turnstile";

const adapter = turnstile({
  siteKey: "0x4AAAAAAA...", // your Turnstile site key
});
```

Pass the same `adapter` instance to both your client-side rendering code and
your server-side verification handler. The adapter holds no mutable state.

---

### 2. Client-side — render a widget

```ts
const container = document.getElementById("captcha")!;

const widget = adapter.render(container, {
  callbacks: {
    onSuccess: (token) => {
      // token.value is the string to submit to your server
      document.querySelector<HTMLInputElement>("[name=cf-turnstile-response]")!.value =
        token.value;
    },
    onExpire: () => {
      // token expired — clear your stored value
      console.log("Token expired, user will need to solve again.");
    },
    onError: (err) => {
      console.error("Turnstile error:", err.message);
    },
  },
});

// On cleanup (e.g. component unmount):
widget.destroy();
```

The Turnstile script is lazy-loaded the first time `render()` is called. You
can call `preloadScript()` earlier in your app to start that request sooner:

```ts
import { preloadScript } from "@captigo/turnstile";

preloadScript(); // fire and forget — safe to call multiple times
```

---

### 3. Server-side — verify the token

**This step is required.** Turnstile tokens are unverified on their own; you
must validate them against Cloudflare's API from your server before trusting
them.

Never expose your secret key to the browser.

```ts
// In an API route, server action, or edge function:
import { adapter } from "./captcha.js"; // your shared adapter instance

export async function POST(request: Request) {
  const body = await request.formData();
  const token = body.get("cf-turnstile-response") as string;

  const result = await adapter.verify(token, process.env.TURNSTILE_SECRET!);

  if (!result.success) {
    return Response.json({ error: "CAPTCHA verification failed" }, { status: 400 });
  }

  // Proceed with the actual request
  return Response.json({ ok: true });
}
```

You can also call the standalone `verifyToken()` function without creating an
adapter — useful in edge runtimes or serverless functions where you don't want
to import the browser-side widget code:

```ts
import { verifyToken } from "@captigo/turnstile";

const result = await verifyToken(token, process.env.TURNSTILE_SECRET!);
```

The optional third argument accepts `{ remoteip }` to forward the visitor's IP
to Cloudflare for additional signal:

```ts
const result = await verifyToken(token, secret, {
  remoteip: request.headers.get("x-forwarded-for") ?? undefined,
});
```

#### Using the score

Turnstile includes a bot-likelihood score in the verification response (0.0 =
likely bot, 1.0 = likely human). It is available on `result.score`:

```ts
const result = await verifyToken(token, secret);
if (!result.success) return Response.json({ error: "CAPTCHA failed" }, { status: 400 });

// Optional: tighten the threshold beyond Cloudflare's own threshold.
if ((result.score ?? 1) < 0.5) {
  return Response.json({ error: "Low confidence score" }, { status: 400 });
}
```

> **Note:** The score is only present for Managed and Invisible widgets. It may
> be absent for some configurations — always treat it as optional.

---

## Invisible widget (interactive mode)

Turnstile supports an invisible mode where no widget is rendered — the
challenge fires when you call `widget.execute()`. Set `execution: "execute"` to
enable it:

```ts
const adapter = turnstile({
  siteKey: "0x4AAAAAAA...",
  execution: "execute",
});

// adapter.meta.mode === "interactive"

const widget = adapter.render(container, { callbacks: { onSuccess: storeToken } });

// On form submit:
async function handleSubmit() {
  const token = await widget.execute("login"); // action label for analytics
  await submitFormWithToken(token.value);
}
```

The `execute()` call returns a `Promise<CaptchaToken>` that resolves when the
challenge completes (which may show a brief overlay to the user).

---

## Configuration reference

All options except `siteKey` are optional.

| Option | Type | Default | Description |
|---|---|---|---|
| `siteKey` | `string` | — | **Required.** Your Turnstile site key. |
| `execution` | `"render" \| "execute"` | `"render"` | `"render"` = visible managed widget. `"execute"` = invisible, requires `widget.execute()`. |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Widget color scheme. |
| `size` | `"normal" \| "compact" \| "flexible"` | `"normal"` | Widget dimensions. |
| `language` | `string` | browser default | Language override (e.g. `"en"`, `"de"`). |
| `appearance` | `"always" \| "execute" \| "interaction-only"` | `"always"` | When to show the widget UI. |
| `action` | `string` | — | Label shown in the Turnstile analytics dashboard. Max 32 chars. |
| `cData` | `string` | — | Arbitrary customer data attached to the challenge. Max 255 bytes. |
| `retry` | `"auto" \| "never"` | `"auto"` | Whether to auto-retry failed challenges. |
| `retryInterval` | `number` | `8000` | Milliseconds between retries. |
| `refreshExpired` | `"auto" \| "manual" \| "never"` | `"auto"` | Token refresh policy on expiry. |
| `refreshTimeout` | `"auto" \| "manual" \| "never"` | `"auto"` | Behavior when the challenge times out. |
| `tabindex` | `number` | — | Tab index for the widget iframe. |

---

## Widget API

```ts
const widget = adapter.render(container, { callbacks });

await widget.execute(action?)  // trigger the challenge (interactive/managed)
widget.reset()                 // reset to unsolved state
widget.destroy()               // remove from DOM, release resources
widget.getToken()              // returns CaptchaToken | null
```

`execute()` behaviour depends on the adapter's mode:
- **managed** (`execution: "render"`) — returns the current token if already
  solved, otherwise waits for the next solve. The user drives the interaction.
- **interactive** (`execution: "execute"`) — triggers the invisible challenge.
  Resolves when the user completes it.

Call `destroy()` on component unmount. After `destroy()`, do not call any other
methods on the widget instance.

---

## Error and expiry handling

```ts
import { CaptchaError } from "@captigo/turnstile";

const widget = adapter.render(container, {
  callbacks: {
    onSuccess: (token) => {
      submitForm(token.value);
    },
    onError: (err) => {
      // err.code is one of: "script-load-failed" | "provider-error" | "execute-failed" | ...
      console.error(`[${err.code}] ${err.message}`);
      showErrorMessage("The CAPTCHA failed. Please try again.");
    },
    onExpire: () => {
      // Fired when a token expires OR when the challenge presentation times out.
      // The widget auto-refreshes by default (refreshExpired / refreshTimeout: "auto").
      clearStoredToken();
    },
  },
});
```

**`onExpire` is called in two situations:**
- A previously issued token has expired (the user took too long to submit).
- The challenge timed out before the user completed it.

In both cases, any stored token is invalid and the widget will reset automatically
(when using the default `refreshExpired: "auto"` / `refreshTimeout: "auto"` settings).

See the [CaptchaError source](https://github.com/moritzmyrz/captigo/blob/main/packages/core/src/errors.ts) for the full list of error codes.

---

## VerifyResult fields

| Field | Type | Description |
|---|---|---|
| `success` | `boolean` | Whether the token passed verification. |
| `provider` | `string` | Always `"turnstile"`. |
| `challengeTs` | `string?` | ISO 8601 timestamp of challenge completion. |
| `hostname` | `string?` | The hostname that rendered the widget. |
| `score` | `number?` | Bot-likelihood score (0.0 = bot, 1.0 = human). |
| `errorCodes` | `string[]?` | Cloudflare error codes if `success` is `false`. |

---

## Important notes

- **Always verify server-side.** A token in your client is not proof of a
  completed challenge until you validate it with `adapter.verify()` or
  `verifyToken()`.
- **One widget per container.** Rendering into the same container element twice
  without calling `destroy()` first will cause unexpected behaviour.
- **Secret key security.** `TURNSTILE_SECRET` must never be included in
  client-side bundles. Keep it in environment variables only accessible to your
  server.

---

## Documentation

- [Server-side verification](https://github.com/moritzmyrz/captigo/blob/main/docs/server-verification.md) (Turnstile section)
- [Compatibility / matrix](https://github.com/moritzmyrz/captigo/blob/main/docs/compatibility.md)
- [Cloudflare Turnstile docs](https://developers.cloudflare.com/turnstile/)

[Repository](https://github.com/moritzmyrz/captigo) · [Issues](https://github.com/moritzmyrz/captigo/issues)
