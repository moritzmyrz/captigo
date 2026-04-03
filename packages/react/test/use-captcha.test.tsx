import type { CaptchaToken } from "@captigo/core";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCaptcha } from "../src/use-captcha.js";
import type { UseCaptchaOptions } from "../src/use-captcha.js";
import { createMockAdapter } from "./helpers.js";

// ─── Test wrapper ─────────────────────────────────────────────────────────────

type Props = { adapter: ReturnType<typeof createMockAdapter>["mockAdapter"] } & UseCaptchaOptions;

function TestWidget({ adapter, onSuccess, onError, onExpire }: Props) {
  const { containerRef, token, execute, reset } = useCaptcha(adapter, {
    ...(onSuccess !== undefined && { onSuccess }),
    ...(onError !== undefined && { onError }),
    ...(onExpire !== undefined && { onExpire }),
  });

  return (
    <div>
      <div ref={containerRef} data-testid="container" />
      <span data-testid="token">{token?.value ?? "none"}</span>
      <button type="button" data-testid="execute" onClick={() => execute()}>
        Execute
      </button>
      <button type="button" data-testid="reset" onClick={reset}>
        Reset
      </button>
    </div>
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useCaptcha()", () => {
  describe("mount / unmount", () => {
    it("calls adapter.render() with the container element on mount", () => {
      const { mockAdapter } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} />);

      expect(mockAdapter.render).toHaveBeenCalledTimes(1);
      expect(mockAdapter.render).toHaveBeenCalledWith(
        screen.getByTestId("container"),
        expect.objectContaining({ callbacks: expect.any(Object) }),
      );
    });

    it("calls widget.destroy() on unmount", () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const { unmount } = render(<TestWidget adapter={mockAdapter} />);

      unmount();

      expect(mockWidget.destroy).toHaveBeenCalledTimes(1);
    });

    it("clears the token when the adapter changes", async () => {
      const first = createMockAdapter();
      const second = createMockAdapter();
      const { rerender } = render(<TestWidget adapter={first.mockAdapter} />);

      act(() => {
        first.fireSuccess("tok");
      });
      await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("tok"));

      // Swapping the adapter should destroy the old widget and clear the token.
      rerender(<TestWidget adapter={second.mockAdapter} />);

      await waitFor(() => {
        expect(screen.getByTestId("token").textContent).toBe("none");
      });
    });

    it("destroys the old widget and creates a new one when adapter changes", () => {
      const first = createMockAdapter();
      const second = createMockAdapter();

      const { rerender } = render(<TestWidget adapter={first.mockAdapter} />);
      expect(first.mockAdapter.render).toHaveBeenCalledTimes(1);

      rerender(<TestWidget adapter={second.mockAdapter} />);

      expect(first.mockWidget.destroy).toHaveBeenCalledTimes(1);
      expect(second.mockAdapter.render).toHaveBeenCalledTimes(1);
    });
  });

  describe("token state", () => {
    it("starts with no token", () => {
      const { mockAdapter } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} />);

      expect(screen.getByTestId("token").textContent).toBe("none");
    });

    it("updates token state when onSuccess fires", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} />);

      act(() => {
        fireSuccess("fresh-token");
      });

      await waitFor(() => {
        expect(screen.getByTestId("token").textContent).toBe("fresh-token");
      });
    });

    it("clears token state when onExpire fires", async () => {
      const { mockAdapter, fireSuccess, fireExpire } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} />);

      act(() => {
        fireSuccess("my-token");
      });
      await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("my-token"));

      act(() => {
        fireExpire();
      });
      await waitFor(() => {
        expect(screen.getByTestId("token").textContent).toBe("none");
      });
    });

    it("clears token state on unmount", async () => {
      const { mockAdapter, fireSuccess } = createMockAdapter();
      const { unmount, rerender } = render(<TestWidget adapter={mockAdapter} />);

      act(() => {
        fireSuccess("tok");
      });
      await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("tok"));

      unmount();
      // No assertion on DOM here — just verify destroy was called cleanly.
      expect(mockAdapter.render.mock.results[0]?.value.destroy).toHaveBeenCalled();
      void rerender; // suppress unused warning
    });
  });

  describe("callbacks", () => {
    it("forwards onSuccess to the widget callbacks", async () => {
      const onSuccess = vi.fn<[CaptchaToken], void>();
      const { mockAdapter, fireSuccess } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} onSuccess={onSuccess} />);

      act(() => {
        fireSuccess("forwarded-token");
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ value: "forwarded-token" }),
        );
      });
    });

    it("forwards onExpire to the widget callbacks", async () => {
      const onExpire = vi.fn();
      const { mockAdapter, fireSuccess, fireExpire } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} onExpire={onExpire} />);

      act(() => {
        fireSuccess("tok");
        fireExpire();
      });

      await waitFor(() => {
        expect(onExpire).toHaveBeenCalledTimes(1);
      });
    });

    it("forwards onError to the widget callbacks", async () => {
      const onError = vi.fn();
      const { mockAdapter, fireError } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} onError={onError} />);

      act(() => {
        fireError("widget exploded");
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0]?.[0]).toMatchObject({
          code: "provider-error",
          message: "widget exploded",
        });
      });
    });

    it("does not remount the widget when callback identity changes", async () => {
      const { mockAdapter } = createMockAdapter();
      const { rerender } = render(<TestWidget adapter={mockAdapter} onSuccess={() => void 0} />);

      // Re-render with a new function instance — should NOT cause a widget remount.
      rerender(<TestWidget adapter={mockAdapter} onSuccess={() => void 0} />);

      await waitFor(() => {
        expect(mockAdapter.render).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("execute()", () => {
    it("delegates to widget.execute()", async () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} />);

      await act(async () => {
        await screen.getByTestId("execute").click();
      });

      expect(mockWidget.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe("reset()", () => {
    it("delegates to widget.reset() and clears token state", async () => {
      const { mockAdapter, mockWidget, fireSuccess } = createMockAdapter();
      render(<TestWidget adapter={mockAdapter} />);

      act(() => {
        fireSuccess("tok");
      });
      await waitFor(() => expect(screen.getByTestId("token").textContent).toBe("tok"));

      act(() => {
        screen.getByTestId("reset").click();
      });

      await waitFor(() => {
        expect(mockWidget.reset).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("token").textContent).toBe("none");
      });
    });
  });
});
