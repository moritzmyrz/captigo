import { Captcha } from "@captigo/react";
import type { CaptchaToken } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";
import type { CSSProperties, FormEvent } from "react";
import { useState } from "react";

/** Stable adapter — never create this inside the component. */
const adapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  theme: "auto",
});

const fieldStyle: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "22rem",
  marginBottom: "0.75rem",
  padding: "0.5rem 0.6rem",
  boxSizing: "border-box",
};

export function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<CaptchaToken | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const canSubmit =
    email.includes("@") && password.length >= 8 && captchaToken !== null && status !== "submitting";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!captchaToken) {
      setMessage("Complete the CAPTCHA before signing up.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setMessage("");

    // Production: POST to your API with JSON; verify the token server-side.
    const payload = {
      email,
      password,
      captchaToken: captchaToken.value,
    };

    await new Promise((r) => setTimeout(r, 400));
    setStatus("done");
    setMessage(
      `Ready to send (demo only): POST ${JSON.stringify({ ...payload, password: "[redacted]" })} to your /signup route, then call verifyToken on the server.`,
    );
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: 520,
        margin: "2rem auto",
        padding: "0 1rem",
        lineHeight: 1.45,
      }}
    >
      <h1 style={{ fontSize: "1.35rem" }}>Sign up</h1>
      <p style={{ color: "#444", fontSize: "0.95rem" }}>
        Realistic pattern: validate fields, require a fresh CAPTCHA token, then submit once. The
        adapter lives <strong>outside</strong> the component so the widget is not remounted every
        render.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <label
          htmlFor="signup-email"
          style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}
        >
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={fieldStyle}
        />

        <label
          htmlFor="signup-password"
          style={{ display: "block", fontSize: "0.85rem", fontWeight: 600 }}
        >
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={fieldStyle}
        />

        <div style={{ margin: "1rem 0" }}>
          <Captcha
            adapter={adapter}
            onSuccess={(t) => {
              setCaptchaToken(t);
              setStatus("idle");
              setMessage("");
            }}
            onExpire={() => {
              setCaptchaToken(null);
              setMessage("CAPTCHA expired — please verify again.");
            }}
            onError={(err) => {
              setCaptchaToken(null);
              setMessage(err.message);
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: "0.55rem 1rem",
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          Create account
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: status === "error" ? "#b00020" : "#333",
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </p>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.8rem", color: "#666" }}>
        Uses the{" "}
        <a href="https://developers.cloudflare.com/turnstile/reference/testing/">
          Turnstile test site key
        </a>
        . For server verification, see{" "}
        <a href="https://github.com/moritzmyrz/captigo/tree/main/examples/react-contact-server">
          react-contact-server
        </a>{" "}
        or{" "}
        <a href="https://github.com/moritzmyrz/captigo/blob/main/docs/server-verification.md">
          docs/server-verification.md
        </a>
        .
      </p>
    </main>
  );
}
