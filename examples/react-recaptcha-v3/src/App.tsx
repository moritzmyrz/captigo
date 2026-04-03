import { Captcha } from "@captigo/react";
import type { CaptchaHandle } from "@captigo/react";
import { recaptchaV3 } from "@captigo/recaptcha";
import { useRef, useState } from "react";

/**
 * Google’s public test key — always returns low risk. Use your own keys in production.
 * @see https://developers.google.com/recaptcha/docs/faq
 */
const adapter = recaptchaV3({
  siteKey: import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY ?? "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
  action: "feedback",
});

export function App() {
  const ref = useRef<CaptchaHandle>(null);
  const [log, setLog] = useState<string>("Click the button to request a scored token.");
  const [busy, setBusy] = useState(false);

  async function runCheck() {
    setBusy(true);
    setLog("Executing…");
    try {
      const token = await ref.current?.execute("feedback");
      if (!token) {
        setLog("Widget not ready.");
        return;
      }
      setLog(
        [
          "Got token (first 24 chars):",
          `${token.value.slice(0, 24)}…`,
          "",
          "The score is NOT in this string — your server must call verifyV3Token and read result.score (0–1).",
          "Typical threshold: reject or step-up if score < 0.5 (tune with data).",
          "",
          "See docs/server-verification.md and packages/recaptcha README.",
        ].join("\n"),
      );
    } catch (e) {
      setLog(e instanceof Error ? e.message : "Execute failed.");
    } finally {
      setBusy(false);
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
      <h1 style={{ fontSize: "1.35rem" }}>reCAPTCHA v3 (passive)</h1>
      <p style={{ color: "#444", fontSize: "0.95rem" }}>
        No checkbox: <code>execute(action)</code> returns a token; risk scores come back from Google
        only after <strong>server-side</strong> verification.
      </p>

      <Captcha ref={ref} adapter={adapter} />

      <button
        type="button"
        onClick={() => void runCheck()}
        disabled={busy}
        style={{ marginTop: "0.75rem" }}
      >
        Run score check
      </button>

      <pre
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "#f6f6f6",
          fontSize: "0.82rem",
          whiteSpace: "pre-wrap",
        }}
      >
        {log}
      </pre>

      <p style={{ marginTop: "1.5rem", fontSize: "0.8rem", color: "#666" }}>
        Google requires showing the v3 badge or disclosing use in your privacy policy.
      </p>
    </main>
  );
}
