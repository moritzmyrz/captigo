import { vi } from "vitest";
import { CaptchaError } from "captigo";
import type { CaptchaAdapter, CaptchaToken, CaptchaWidget, WidgetCallbacks } from "captigo";

// ─── Shared test fixtures ─────────────────────────────────────────────────────

export type MockWidget = {
  [K in keyof CaptchaWidget]: ReturnType<typeof vi.fn>;
};

export type CapturedRender = {
  container: HTMLElement;
  callbacks: WidgetCallbacks;
};

/**
 * Creates a mock adapter + widget pair with helpers to simulate
 * provider callbacks (success, expire, error) in tests.
 */
export function createMockAdapter() {
  let lastRender: CapturedRender | null = null;

  const mockWidget: MockWidget = {
    execute: vi.fn<[string?], Promise<CaptchaToken>>().mockImplementation(() =>
      Promise.resolve({ value: "test-token", provider: "turnstile", issuedAt: Date.now() }),
    ),
    reset: vi.fn<[], void>(),
    destroy: vi.fn<[], void>(),
    getToken: vi.fn<[], CaptchaToken | null>().mockReturnValue(null),
  };

  const mockAdapter = {
    meta: { id: "mock", mode: "managed" as const, requiresContainer: true },
    config: { siteKey: "test-key" },
    render: vi.fn<[HTMLElement, { callbacks: WidgetCallbacks }], CaptchaWidget>().mockImplementation(
      (container, options) => {
        lastRender = { container, callbacks: options.callbacks };
        return mockWidget as unknown as CaptchaWidget;
      },
    ),
    verify: vi.fn(),
  } satisfies CaptchaAdapter;

  const getLastRender = (): CapturedRender => {
    if (!lastRender) throw new Error("adapter.render() has not been called yet");
    return lastRender;
  };

  const fireSuccess = (value = "tok-123") => {
    const { callbacks } = getLastRender();
    const token: CaptchaToken = { value, provider: "turnstile", issuedAt: Date.now() };
    callbacks.onSuccess(token);
    return token;
  };

  const fireExpire = () => {
    getLastRender().callbacks.onExpire?.();
  };

  const fireError = (message = "challenge failed") => {
    getLastRender().callbacks.onError?.(new CaptchaError("provider-error", message, "mock"));
  };

  return { mockAdapter, mockWidget, getLastRender, fireSuccess, fireExpire, fireError };
}
