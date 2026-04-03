import type { CaptchaAdapter, CaptchaToken } from "@captigo/core";
import { Captcha } from "@captigo/react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { type CaptchaProvider, createCaptchaAdapter } from "./adapter";

const defaultProvider: CaptchaProvider =
  import.meta.env.VITE_CAPTCHA_PROVIDER === "hcaptcha" ? "hcaptcha" : "turnstile";

export function App() {
  const [provider, setProvider] = useState<CaptchaProvider>(defaultProvider);
  const [adapter, setAdapter] = useState<CaptchaAdapter>(() =>
    createCaptchaAdapter(defaultProvider),
  );
  const [token, setToken] = useState<CaptchaToken | null>(null);
  const [note, setNote] = useState("");

  const label = useMemo(() => adapter.meta.id, [adapter]);

  function switchProvider(next: CaptchaProvider) {
    setProvider(next);
    setAdapter(createCaptchaAdapter(next));
    setToken(null);
    setNote(`Switched to ${next} — complete the challenge again.`);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setNote("Solve the CAPTCHA before submit.");
      return;
    }
    setNote(
      `Would POST token to your API (provider: ${label}). Always verify server-side with the matching secret.`,
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
      <h1 style={{ fontSize: "1.35rem" }}>One form, two providers</h1>
      <p style={{ color: "#444", fontSize: "0.95rem" }}>
        The form only depends on <code>CaptchaAdapter</code>. Swap the factory — not your JSX — when
        you change vendors or run A/B tests.
      </p>

      <fieldset style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "0.75rem" }}>
        <legend style={{ fontSize: "0.85rem" }}>Provider</legend>
        <label style={{ marginRight: "1rem" }}>
          <input
            type="radio"
            name="p"
            checked={provider === "turnstile"}
            onChange={() => switchProvider("turnstile")}
          />{" "}
          Turnstile
        </label>
        <label>
          <input
            type="radio"
            name="p"
            checked={provider === "hcaptcha"}
            onChange={() => switchProvider("hcaptcha")}
          />{" "}
          hCaptcha
        </label>
      </fieldset>

      <form onSubmit={onSubmit}>
        <Captcha
          key={provider}
          adapter={adapter}
          onSuccess={(t) => {
            setToken(t);
            setNote("");
          }}
          onExpire={() => setToken(null)}
          onError={(err) => {
            setToken(null);
            setNote(err.message);
          }}
        />

        <p style={{ fontSize: "0.85rem", color: "#555" }}>
          Active adapter: <code>{label}</code> ({adapter.meta.mode})
        </p>

        <button type="submit" style={{ marginTop: "0.5rem" }} disabled={!token}>
          Submit (demo)
        </button>
      </form>

      {note && (
        <p style={{ marginTop: "1rem", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>{note}</p>
      )}

      <p style={{ marginTop: "2rem", fontSize: "0.8rem", color: "#666" }}>
        Defaults use Turnstile and hCaptcha{" "}
        <a href="https://developers.cloudflare.com/turnstile/reference/testing/">test keys</a>. Set{" "}
        <code>VITE_CAPTCHA_PROVIDER=hcaptcha|turnstile</code> for the initial provider.
      </p>
    </main>
  );
}
