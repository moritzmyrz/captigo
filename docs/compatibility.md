# Compatibility Reference

This document expands on the compatibility matrix in the root README. It covers per-provider notes, known limitations, and guidance for choosing the right provider.

---

## Full matrix

| Provider | Visible | Invisible | Passive | Reset | Destroy | Verify | Score | React | Vue | Example | Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Turnstile | ✅ | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **stable** |
| hCaptcha | ✅ | ✅ | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | **beta** |
| reCAPTCHA v2 | ✅ | ✅ | — | ✅ | ⚠️ | ✅ | — | ✅ | ✅ | — | **beta** |
| reCAPTCHA v3 | — | — | ✅ | — | ✅ | ✅ | ✅ | ✅ | ✅ | — | **beta** |

### Column definitions

| Column | Meaning |
|---|---|
| **Visible** | Managed mode: a visible checkbox widget that challenges automatically on interaction |
| **Invisible** | Interactive mode: no visible widget; `widget.execute()` triggers the challenge programmatically |
| **Passive** | Passive / score-based mode: no user interaction at all; `execute()` contacts the provider and returns a scored token immediately |
| **Reset** | `widget.reset()` returns the widget to its initial unsolved state |
| **Destroy** | `widget.destroy()` removes the widget from the DOM and frees all resources |
| **Verify** | A server-side `verifyToken()` helper is exported by the adapter package |
| **Score** | The `VerifyResult` returned by `verifyToken()` includes a `score` field (`0.0`–`1.0`) |
| **React** | Works with `@captigo/react` (`<Captcha>` and `useCaptcha`) |
| **Vue** | Works with `@captigo/vue` (`<Captcha>` and `useCaptcha`) |
| **Example** | A runnable example app is included in `examples/` |

### Status definitions

| Status | Meaning |
|---|---|
| **stable** | Primary supported path. Well-tested, actively maintained, and production-ready given normal 0.x caveats. API changes will follow semver. |
| **beta** | Functional and tested. Receives less focused maintenance than the stable path. May have edge cases. API is stable but not yet battle-tested in production. |
| **planned** | Not yet implemented. Tracked for a future release. |

---

## Provider notes

### Cloudflare Turnstile

**Status: stable.** This is the primary golden path for captigo.

- Both visible (`execution: "render"`) and invisible (`execution: "execute"`) modes are implemented and well-tested.
- The verify result includes a `score` field. Cloudflare derives this from signals about the request; it is not the same as a traditional bot score but can be used as an additional signal.
- The `timeout-callback` from the SDK fires when the challenge presentation times out before the user completes it. captigo maps this to `onExpire`.
- A runnable Vite + React example is available at [`examples/react-turnstile`](../examples/react-turnstile).

**Recommended for:** new projects; invisible widget flows; privacy-conscious applications.

---

### hCaptcha

**Status: beta.** Functional with both visible and invisible modes.

- Uses `size: "invisible"` to enable the interactive (invisible) mode.
- hCaptcha fires a `chalexpired-callback` when the invisible challenge popup times out before the user solves it. captigo maps this to a `CaptchaError("execute-failed")` rejection on any pending `execute()` promises. Note that `onExpire` is **not** called in this case — only pending execute promises are rejected.
- The server-side `verifyToken()` response does not include a `score` in the standard tier. Enterprise accounts may receive one, but captigo does not currently map it.
- The `action` label passed to `widget.execute()` is silently ignored — hCaptcha v2 does not support per-execute action labels.
- No dedicated example app. Works with all existing examples by swapping the adapter.

**Recommended for:** privacy-focused applications; Cloudflare alternatives.

---

### reCAPTCHA v2

**Status: beta.** Checkbox and invisible modes both work.

- `size: "checkbox"` or `size: "compact"` → managed (visible checkbox) mode.
- `size: "invisible"` → interactive mode; `widget.execute()` triggers the invisible challenge.
- **Known limitation — destroy:** The reCAPTCHA v2 SDK does not expose a `remove()` API. `widget.destroy()` calls `grecaptcha.reset()` internally instead. The widget's DOM element is **not** removed from the page. If you need the element removed, remove it from the DOM yourself after calling `destroy()`.
- The `action` label passed to `widget.execute()` is silently ignored — reCAPTCHA v2 does not support action labels.
- Error reporting from the SDK is minimal: the `error-callback` fires without an error code. `onError` will receive a generic `CaptchaError("provider-error")` with no provider-specific detail.
- No dedicated example app.

**Recommended for:** applications already using reCAPTCHA; migration scenarios.

---

### reCAPTCHA v3

**Status: beta.** Score-based (passive) mode works.

- No DOM widget is rendered. The `<Captcha>` component and `useCaptcha` hook still create a container `<div>`, but the adapter ignores it (`meta.requiresContainer === false`). You can pass `style={{ display: "none" }}` to hide the empty div.
- Each call to `widget.execute()` fetches a fresh token from Google. Tokens are not cached — calling `execute()` twice gets two separate tokens.
- `widget.reset()` exists for interface compliance but is effectively a no-op — it clears the cached `lastToken` but there is no stateful widget to reset.
- The verify result includes a `score` (`0.0`–`1.0`) where `0.0` = likely bot and `1.0` = likely human. Google does not publish the exact thresholds; `0.5` is a common starting point.
- Google requires that you render the reCAPTCHA v3 badge or include an attribution in your privacy policy.
- No dedicated example app.

**Recommended for:** invisible bot detection where you want a score rather than a user challenge.

---

## Recommended pairings

| Use case | Provider | Mode | Notes |
|---|---|---|---|
| Standard form protection | Turnstile | Visible | Simplest integration; no puzzles for users |
| Invisible form submit | Turnstile | Invisible | Call `execute("action")` on submit |
| Privacy-first | hCaptcha | Visible | GDPR-friendly; similar API to Turnstile |
| Score-based bot detection | reCAPTCHA v3 | Passive | No user friction; requires score threshold tuning |
| Existing Google users | reCAPTCHA v2 | Visible or Invisible | Migration path; note destroy limitation |

---

## Framework support

Both `@captigo/react` and `@captigo/vue` work identically with all provider adapters. The framework packages do not know which provider is underneath.

| Framework package | React version | Vue version | Strict Mode |
|---|---|---|---|
| `@captigo/react` | ≥ 18.0 | — | ✅ compatible |
| `@captigo/vue` | — | ≥ 3.0 | ✅ compatible |

**Planned framework integrations:** `@captigo/nextjs`, `@captigo/sveltekit` — not yet implemented.

---

## What is not yet implemented

- `@captigo/nextjs` — Next.js-specific helpers (Server Actions, App Router patterns)
- `@captigo/sveltekit` — SvelteKit form action integration
- hCaptcha enterprise score — the `score` field in hCaptcha's enterprise verify response is not currently mapped to `VerifyResult.score`
- Idempotency key support for Turnstile's `siteverify` endpoint
