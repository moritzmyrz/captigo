import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Captcha } from "../src/captcha.js";
import type { CaptchaHandle } from "../src/captcha.js";
import { createMockAdapter } from "./helpers.js";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("<Captcha />", () => {
  describe("rendering", () => {
    it("renders a div container", () => {
      const { mockAdapter } = createMockAdapter();
      render(<Captcha adapter={mockAdapter} data-testid="captcha" />);

      expect(screen.getByTestId("captcha").tagName).toBe("DIV");
    });

    it("passes className to the container div", () => {
      const { mockAdapter } = createMockAdapter();
      render(<Captcha adapter={mockAdapter} className="my-class" data-testid="captcha" />);

      expect(screen.getByTestId("captcha")).toHaveProperty("className", "my-class");
    });

    it("passes id to the container div", () => {
      const { mockAdapter } = createMockAdapter();
      render(<Captcha adapter={mockAdapter} id="my-captcha" />);

      expect(document.getElementById("my-captcha")).not.toBeNull();
    });

    it("calls adapter.render() with the container on mount", () => {
      const { mockAdapter } = createMockAdapter();
      render(<Captcha adapter={mockAdapter} data-testid="captcha" />);

      expect(mockAdapter.render).toHaveBeenCalledWith(
        screen.getByTestId("captcha"),
        expect.any(Object),
      );
    });
  });

  describe("lifecycle", () => {
    it("destroys the widget on unmount", () => {
      const { mockAdapter, mockWidget } = createMockAdapter();
      const { unmount } = render(<Captcha adapter={mockAdapter} />);

      unmount();

      expect(mockWidget.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe("callbacks", () => {
    it("calls onSuccess when the widget fires a token", async () => {
      const onSuccess = vi.fn();
      const { mockAdapter, fireSuccess } = createMockAdapter();
      render(<Captcha adapter={mockAdapter} onSuccess={onSuccess} />);

      act(() => {
        fireSuccess("tok-from-provider");
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ value: "tok-from-provider" }),
        );
      });
    });

    it("calls onExpire when the token expires", async () => {
      const onExpire = vi.fn();
      const { mockAdapter, fireSuccess, fireExpire } = createMockAdapter();
      render(<Captcha adapter={mockAdapter} onExpire={onExpire} />);

      act(() => {
        fireSuccess("tok");
        fireExpire();
      });

      await waitFor(() => {
        expect(onExpire).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("CaptchaHandle (ref)", () => {
    it("exposes execute() via ref", async () => {
      const ref = createRef<CaptchaHandle>();
      const { mockAdapter, mockWidget } = createMockAdapter();
      render(<Captcha ref={ref} adapter={mockAdapter} />);

      expect(ref.current).not.toBeNull();

      await act(async () => {
        await ref.current?.execute();
      });

      expect(mockWidget.execute).toHaveBeenCalledTimes(1);
    });

    it("exposes reset() via ref", async () => {
      const ref = createRef<CaptchaHandle>();
      const { mockAdapter, mockWidget } = createMockAdapter();
      render(<Captcha ref={ref} adapter={mockAdapter} />);

      act(() => {
        ref.current?.reset();
      });

      expect(mockWidget.reset).toHaveBeenCalledTimes(1);
    });

    it("exposes getToken() via ref, returns null before solve", () => {
      const ref = createRef<CaptchaHandle>();
      const { mockAdapter } = createMockAdapter();
      render(<Captcha ref={ref} adapter={mockAdapter} />);

      expect(ref.current?.getToken()).toBeNull();
    });

    it("getToken() returns the current token after solve", async () => {
      const ref = createRef<CaptchaHandle>();
      const { mockAdapter, fireSuccess } = createMockAdapter();
      render(<Captcha ref={ref} adapter={mockAdapter} />);

      act(() => {
        fireSuccess("handle-token");
      });

      await waitFor(() => {
        expect(ref.current?.getToken()?.value).toBe("handle-token");
      });
    });

    it("execute() passes the action to widget.execute()", async () => {
      const ref = createRef<CaptchaHandle>();
      const { mockAdapter, mockWidget } = createMockAdapter();
      render(<Captcha ref={ref} adapter={mockAdapter} />);

      await act(async () => {
        await ref.current?.execute("checkout");
      });

      expect(mockWidget.execute).toHaveBeenCalledWith("checkout");
    });
  });
});
