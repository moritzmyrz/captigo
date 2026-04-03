# @captigo/turnstile

## 0.2.0

### Minor Changes

- Map `score` on `VerifyResult` when Cloudflare’s siteverify response includes it.
- Handle SDK `timeout-callback`: clear token, reset execution state, and call `onExpire`.
- On script load failure, notify `onError` from the widget `ready` rejection; avoid calling `onError` again from `execute()` so failures are not doubled. Preserve `CaptchaError` instances raised by `loadScript`.
- Tests for script loading, widget lifecycle, and verification normalization.

### Patch Changes

- Depend on `@captigo/core@0.2.0`.

## 0.1.0

### Minor Changes

- Initial public release: core types, Turnstile, hCaptcha, reCAPTCHA v2/v3 adapters, React and Vue integrations.

### Patch Changes

- Updated dependencies []:
  - @captigo/core@0.1.0
