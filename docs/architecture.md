# Captigo — Core Architecture

This document explains the design decisions behind `captigo`'s abstractions. It's aimed at contributors and anyone building a provider adapter or framework integration.

---

## Package roles

```
@captigo/core         Core types, adapter contract, error model — no runtime code
@captigo/shared       Internal HTTP helpers used by provider packages (private)
@captigo/turnstile    Cloudflare Turnstile adapter
@captigo/hcaptcha     hCaptcha adapter
@captigo/recaptcha    Google reCAPTCHA v2/v3 adapter
@captigo/react        React useCaptcha hook + <Captcha> component
@captigo/vue          Vue 3 useCaptcha composable + <Captcha> component
@captigo/nextjs       Server helpers for Web Request (e.g. App Router); no UI
```

Application code typically depends on `@captigo/core` for types (often transitively via a framework or provider package). Framework packages depend on `@captigo/core`. Provider packages depend on both `@captigo/core` and `@captigo/shared` at build time; `@captigo/shared` is bundled into published provider packages.

---

## The three-mode model

CAPTCHA providers differ in how much they require from the user, which affects how framework integrations render and trigger them. Captigo models this with three modes:

| Mode | Description | Examples |
|---|---|---|
| `"managed"` | Visible widget. Challenge fires automatically on interaction. | Turnstile (default), hCaptcha checkbox, reCAPTCHA v2 checkbox |
| `"interactive"` | Invisible widget. Challenge only fires when `execute()` is called. | Turnstile invisible, hCaptcha invisible, reCAPTCHA v2 invisible |
| `"passive"` | Score-based, no UI. `execute()` resolves immediately with a scored token. | reCAPTCHA v3 |

The mode is derived from the adapter's **config** at construction time (e.g. `execution: "execute"` for Turnstile, `version: "v3"` for reCAPTCHA). It is stored as `adapter.meta.mode` and used by framework packages to decide whether to call `execute()` automatically or expose it to the consumer.

---

## Adapter vs Widget separation

The central design choice is separating the **adapter** (stateless, config-holder) from the **widget** (stateful, DOM-bound instance).

```
CaptchaAdapter                      CaptchaWidget
───────────────                     ─────────────
+ meta: AdapterMeta     render() →  + execute(action?)
+ render()                          + reset()
+ verify()                          + destroy()
                                    + getToken()
```

**Why this matters:**

- An adapter can render multiple independent widget instances (e.g. multiple forms on one page).
- The adapter's `verify()` path is server-side only. It never touches widget state.
- Framework packages manage the widget's lifetime (create on mount, destroy on unmount) without knowing anything about the provider internals.

---

## Why `verify()` lives on the adapter

Alternative: a standalone `verify(provider, token, secret)` function.

We chose `adapter.verify(token, secret)` because:

1. The adapter already holds the provider ID and any endpoint overrides (e.g. hCaptcha enterprise). Passing these separately to a standalone function would be redundant.
2. It keeps provider packages self-contained — one import, one instance, full lifecycle.
3. It follows the adapter pattern: consumers interact with one object regardless of which provider is underneath.

The tradeoff is that server-side code that only needs verification still imports the provider package. This is acceptable given that tree-shaking removes the client-side render code in server bundles.

---

## Error model

All errors thrown by captigo are instances of `CaptchaError`. This lets consumer code do:

```ts
try {
  await adapter.verify(token, secret);
} catch (err) {
  if (err instanceof CaptchaError && err.code === "provider-error") {
    // Handle provider-side rejection
  }
  throw err;
}
```

Error codes are a union of string literals (`CaptchaErrorCode`), not an enum. This avoids the ES module overhead of a const enum and is easier to consume in plain JS.

---

## What is intentionally left to provider packages

The core defines **what** must be implemented, not **how**. Provider packages own:

- Script loading (lazy, deduped, with error handling)
- Widget render options beyond the common config (widget ID, tabindex, appearance, locale details)
- Retry logic for script load failures
- Response field mapping (provider APIs return different JSON shapes)
- Score threshold logic (reCAPTCHA v3's `scoreThreshold` is checked inside the adapter's `verify()`, not by the core)

---

## What is intentionally left to framework packages

Framework packages own:

- DOM ref lifecycle (create widget on mount, destroy on unmount)
- Reactive state (`isLoading`, `isReady`, `token`)
- The decision of whether to call `execute()` on submit or let the widget fire automatically
- Component API design (prop names, event names, styling)

They do **not** know anything about which provider is underneath — they only interact with the `CaptchaAdapter` and `CaptchaWidget` interfaces from `@captigo/core`.

---

## Example data flow

```
1. Consumer creates adapter:
   const adapter = turnstile({ siteKey: "..." })
   adapter.meta → { id: "turnstile", mode: "managed", requiresContainer: true }

2. Framework mounts widget:
   const widget = adapter.render(containerEl, { config, callbacks })

3. User solves challenge:
   callbacks.onSuccess({ value: "TOKEN", provider: "turnstile", issuedAt: Date.now() })

4. Token sent to server. Server verifies:
   const result = await adapter.verify(token, secretKey)
   result → { success: true, provider: "turnstile", hostname: "example.com" }

5. User navigates away. Framework cleans up:
   widget.destroy()
```

For `interactive` mode (invisible widgets), step 3 is replaced by:

```
3a. User clicks submit button.
3b. Framework calls: const token = await widget.execute()
3c. Provider overlay appears briefly, resolves.
3d. token → { value: "TOKEN", ... }
```
