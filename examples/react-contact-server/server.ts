/**
 * Minimal Express API for the contact form example.
 * Verifies the Turnstile token before accepting the message.
 */
import { verifyToken } from "@captigo/turnstile";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.CONTACT_API_PORT ?? 8787);

// Allow any localhost port so other examples (e.g. Vue on 5174) can call the same API in dev.
app.use(
  cors({
    origin: /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/,
  }),
);
app.use(express.json({ limit: "32kb" }));

app.post("/api/contact", async (req, res) => {
  const body = req.body as { email?: string; message?: string; token?: string };
  const { email, message, token } = body;

  if (typeof email !== "string" || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required." });
    return;
  }
  if (typeof message !== "string" || message.trim().length < 3) {
    res.status(400).json({ error: "Message is too short." });
    return;
  }
  if (typeof token !== "string" || !token) {
    res.status(400).json({ error: "CAPTCHA token missing." });
    return;
  }

  const secret = process.env.TURNSTILE_SECRET ?? "1x0000000000000000000000000000000AA";

  try {
    const forwarded = req.headers["x-forwarded-for"];
    const remoteip = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;

    const result = await verifyToken(token, secret, remoteip ? { remoteip } : undefined);

    if (!result.success) {
      res.status(400).json({
        error: "CAPTCHA verification failed.",
        codes: result.errorCodes,
      });
      return;
    }

    // In production: persist message, send email, etc.
    console.info("[contact]", `${email.slice(0, 3)}…`, message.length, "chars");
    res.json({ ok: true });
  } catch {
    res.status(502).json({ error: "Verification service error." });
  }
});

app.listen(port, () => {
  console.info(`Contact API listening on http://127.0.0.1:${port}`);
});
