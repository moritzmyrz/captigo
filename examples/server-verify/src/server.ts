/**
 * captigo — server-side verification example
 *
 * Demonstrates token verification for Turnstile, hCaptcha, and reCAPTCHA
 * in a minimal Express server.
 *
 * Run: pnpm --filter @captigo-examples/server-verify dev
 * Test: curl -X POST http://localhost:3000/verify/turnstile -H "Content-Type: application/json" \
 *         -d '{"token":"XXXX.DUMMY.TOKEN.XXXX"}'
 */

import { CaptchaError } from "@captigo/core";
import { verifyToken as verifyHcaptcha } from "@captigo/hcaptcha";
import { verifyV2Token, verifyV3Token } from "@captigo/recaptcha";
import { verifyToken as verifyTurnstile } from "@captigo/turnstile";
import express from "express";

const app = express();
app.use(express.json());

// ─── Turnstile ────────────────────────────────────────────────────────────────

app.post("/verify/turnstile", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "Missing token" });
    return;
  }

  const secret = process.env["TURNSTILE_SECRET"] ?? "1x0000000000000000000000000000000AA"; // test secret

  try {
    const result = await verifyTurnstile(
      token,
      secret,
      // Optional: pass the end-user IP for better fraud detection
      { remoteip: req.ip },
    );

    if (!result.success) {
      res.status(400).json({ error: "Verification failed", codes: result.errorCodes });
      return;
    }

    res.json({
      ok: true,
      provider: result.provider,
      hostname: result.hostname,
      challengeTs: result.challengeTs,
    });
  } catch (err) {
    if (err instanceof CaptchaError) {
      res.status(502).json({ error: err.message, code: err.code });
    } else {
      res.status(500).json({ error: "Internal error" });
    }
  }
});

// ─── hCaptcha ────────────────────────────────────────────────────────────────

app.post("/verify/hcaptcha", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "Missing token" });
    return;
  }

  const secret = process.env["HCAPTCHA_SECRET"] ?? "0x0000000000000000000000000000000000000000";

  try {
    const result = await verifyHcaptcha(token, secret);

    if (!result.success) {
      res.status(400).json({ error: "Verification failed", codes: result.errorCodes });
      return;
    }

    res.json({ ok: true, provider: result.provider });
  } catch (err) {
    if (err instanceof CaptchaError) {
      res.status(502).json({ error: err.message, code: err.code });
    } else {
      res.status(500).json({ error: "Internal error" });
    }
  }
});

// ─── reCAPTCHA v2 ────────────────────────────────────────────────────────────

app.post("/verify/recaptcha-v2", async (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "Missing token" });
    return;
  }

  const secret = process.env["RECAPTCHA_V2_SECRET"] ?? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

  try {
    const result = await verifyV2Token(token, secret);

    if (!result.success) {
      res.status(400).json({ error: "Verification failed", codes: result.errorCodes });
      return;
    }

    res.json({ ok: true, provider: result.provider });
  } catch (err) {
    if (err instanceof CaptchaError) {
      res.status(502).json({ error: err.message, code: err.code });
    } else {
      res.status(500).json({ error: "Internal error" });
    }
  }
});

// ─── reCAPTCHA v3 ────────────────────────────────────────────────────────────

app.post("/verify/recaptcha-v3", async (req, res) => {
  const { token, minScore = 0.5 } = req.body as { token?: string; minScore?: number };
  if (!token) {
    res.status(400).json({ error: "Missing token" });
    return;
  }

  const secret = process.env["RECAPTCHA_V3_SECRET"] ?? "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";

  try {
    const result = await verifyV3Token(token, secret);

    if (!result.success || (result.score !== undefined && result.score < minScore)) {
      res.status(400).json({
        error: "Verification failed or score too low",
        score: result.score,
      });
      return;
    }

    res.json({ ok: true, provider: result.provider, score: result.score, action: result.action });
  } catch (err) {
    if (err instanceof CaptchaError) {
      res.status(502).json({ error: err.message, code: err.code });
    } else {
      res.status(500).json({ error: "Internal error" });
    }
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env["PORT"] ?? 3000;
app.listen(PORT, () => {
  console.log(`captigo server-verify example running at http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  POST /verify/turnstile      { token }");
  console.log("  POST /verify/hcaptcha       { token }");
  console.log("  POST /verify/recaptcha-v2   { token }");
  console.log("  POST /verify/recaptcha-v3   { token, minScore? }");
});
