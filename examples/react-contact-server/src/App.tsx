import { Captcha } from "@captigo/react";
import type { CaptchaHandle, CaptchaToken } from "@captigo/react";
import { turnstile } from "@captigo/turnstile";
import type { CSSProperties, FormEvent } from "react";
import { useRef, useState } from "react";

const adapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  theme: "auto",
});

const field: CSSProperties = {
  display: "block",
  width: "100%",
  maxWidth: "24rem",
  marginBottom: "0.65rem",
  padding: "0.45rem 0.55rem",
  boxSizing: "border-box",
};

export function App() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<CaptchaToken | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  const [ui, setUi] = useState<{ kind: "idle" | "ok" | "err"; text: string }>({
    kind: "idle",
    text: "",
  });
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setUi({ kind: "err", text: "Complete the CAPTCHA first." });
      return;
    }

    setPending(true);
    setUi({ kind: "idle", text: "" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          token: token.value,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };

      if (!res.ok) {
        setUi({ kind: "err", text: data.error ?? `Request failed (${res.status})` });
        return;
      }

      setUi({ kind: "ok", text: "Message sent. (Demo: check the API terminal for a log line.)" });
      setMessage("");
      setToken(null);
      captchaRef.current?.reset();
    } catch {
      setUi({ kind: "err", text: "Network error — is the API running on port 8787?" });
    } finally {
      setPending(false);
    }
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
      <h1 style={{ fontSize: "1.35rem" }}>Contact us</h1>
      <p style={{ color: "#444", fontSize: "0.95rem" }}>
        Browser posts to the Vite dev server; Vite proxies <code>/api</code> to Express. The API
        calls <code>verifyToken</code> before accepting the payload — the pattern you want for any
        production form.
      </p>

      <form onSubmit={(e) => void onSubmit(e)}>
        <label htmlFor="contact-email" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={field}
        />

        <label htmlFor="contact-message" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={3}
          rows={4}
          style={field}
        />

        <div style={{ margin: "0.9rem 0" }}>
          <Captcha
            ref={captchaRef}
            adapter={adapter}
            onSuccess={(t) => {
              setToken(t);
              if (ui.kind === "err") setUi({ kind: "idle", text: "" });
            }}
            onExpire={() => {
              setToken(null);
              setUi({ kind: "err", text: "CAPTCHA expired — solve again before sending." });
            }}
            onError={(err) => {
              setToken(null);
              setUi({ kind: "err", text: err.message });
            }}
          />
        </div>

        <button type="submit" disabled={!token || message.trim().length < 3 || pending}>
          Send
        </button>
      </form>

      {ui.text && (
        <output
          aria-live="polite"
          style={{
            display: "block",
            marginTop: "1rem",
            fontSize: "0.9rem",
            color: ui.kind === "err" ? "#b00020" : ui.kind === "ok" ? "#0d5f2e" : "#333",
          }}
        >
          {ui.text}
        </output>
      )}
    </main>
  );
}
