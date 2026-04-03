import { useRef, useState } from "react";
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/react";
import type { CaptchaHandle, CaptchaToken } from "@captigo/react";

// ---------------------------------------------------------------------------
// Adapters — created once outside the component so the widget isn't remounted
// on every render.
// ---------------------------------------------------------------------------

// Managed: renders a visible checkbox; challenge fires automatically.
const managedAdapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA", // test key
  theme: "auto",
});

// Interactive (invisible): no visible widget; execute() must be called explicitly.
const invisibleAdapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  execution: "execute",
});

// ---------------------------------------------------------------------------
// Demo: managed widget
// ---------------------------------------------------------------------------

function ManagedExample() {
  const [token, setToken] = useState<CaptchaToken | null>(null);
  const [status, setStatus] = useState<string>("Waiting…");

  const handleSuccess = (t: CaptchaToken) => {
    setToken(t);
    setStatus(`Token received (${t.value.slice(0, 12)}…). Would send to server here.`);
  };

  const handleExpire = () => {
    setToken(null);
    setStatus("Token expired. Please solve the challenge again.");
  };

  return (
    <section>
      <h2>Managed widget (visible checkbox)</h2>
      <p>The challenge fires automatically when the user interacts with the widget.</p>

      <Captcha
        adapter={managedAdapter}
        onSuccess={handleSuccess}
        onExpire={handleExpire}
        onError={(err) => setStatus(`Error: ${err.message}`)}
      />

      <p>
        <strong>Status:</strong> {status}
      </p>

      {token && (
        <p style={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
          Token: {token.value}
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Demo: invisible widget with imperative execute
// ---------------------------------------------------------------------------

function InvisibleExample() {
  const captchaRef = useRef<CaptchaHandle>(null);
  const [status, setStatus] = useState<string>("Click 'Submit' to trigger the challenge.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Triggering challenge…");
    try {
      const token = await captchaRef.current!.execute("example-submit");
      setStatus(`Token received (${token.value.slice(0, 12)}…). Would send to server here.`);
    } catch {
      setStatus("Challenge failed or was cancelled.");
    }
  };

  return (
    <section>
      <h2>Invisible widget (execute on submit)</h2>
      <p>No visible widget is rendered. The challenge fires when you click Submit.</p>

      <form onSubmit={handleSubmit}>
        {/* The Captcha component renders an empty container — attach it anywhere */}
        <Captcha ref={captchaRef} adapter={invisibleAdapter} />
        <button type="submit">Submit</button>
      </form>

      <p>
        <strong>Status:</strong> {status}
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function App() {
  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 600, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>captigo — React + Turnstile</h1>
      <p>
        This example uses the{" "}
        <a href="https://developers.cloudflare.com/turnstile/reference/testing/">
          Turnstile test site key
        </a>{" "}
        which always passes. Set <code>VITE_TURNSTILE_SITE_KEY</code> in{" "}
        <code>.env.local</code> to use a real key.
      </p>

      <ManagedExample />
      <hr />
      <InvisibleExample />
    </main>
  );
}
