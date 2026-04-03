<script setup lang="ts">
import type { CaptchaError } from "@captigo/core";
import { turnstile } from "@captigo/turnstile";
import { Captcha } from "@captigo/vue";
import type { CaptchaInstance, CaptchaToken } from "@captigo/vue";
import { ref } from "vue";

const adapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  theme: "auto",
});

/** When set, POSTs to `${base}/api/contact` (start the Express app from react-contact-server). */
const apiBase = (import.meta.env.VITE_CONTACT_API_BASE ?? "").replace(/\/$/, "");

const name = ref("");
const email = ref("");
const message = ref("");
const token = ref<CaptchaToken | null>(null);
const captchaRef = ref<CaptchaInstance>();
const status = ref<{ kind: "info" | "ok" | "err"; text: string } | null>(null);
const pending = ref(false);

function onCaptchaSuccess(t: CaptchaToken) {
  token.value = t;
  status.value = null;
}

function onCaptchaExpire() {
  token.value = null;
  status.value = { kind: "err", text: "CAPTCHA expired." };
}

function onCaptchaError(err: CaptchaError) {
  token.value = null;
  status.value = { kind: "err", text: err.message };
}

async function submit() {
  if (!token.value) {
    status.value = { kind: "err", text: "Complete the CAPTCHA first." };
    return;
  }

  pending.value = true;
  status.value = null;

  const body = {
    email: email.value.trim(),
    message: `${name.value.trim()}: ${message.value.trim()}`,
    token: token.value.value,
  };

  try {
    if (apiBase) {
      const res = await fetch(`${apiBase}/api/contact`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        status.value = { kind: "err", text: data.error ?? `HTTP ${res.status}` };
        return;
      }
      status.value = {
        kind: "ok",
        text: "Sent. Check the API terminal for a log line.",
      };
      message.value = "";
      token.value = null;
      captchaRef.value?.reset();
    } else {
      await new Promise((r) => setTimeout(r, 200));
      status.value = {
        kind: "info",
        text: `No VITE_CONTACT_API_BASE — payload only:\n${JSON.stringify({ ...body, token: `${body.token.slice(0, 16)}…` }, null, 2)}\n\nSet VITE_CONTACT_API_BASE=http://127.0.0.1:8787 and run the API from examples/react-contact-server (pnpm dev:api).`,
      };
    }
  } catch {
    status.value = {
      kind: "err",
      text: "Request failed — is the API running? See README.",
    };
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <main style="font-family: system-ui, sans-serif; max-width: 520px; margin: 2rem auto; padding: 0 1rem">
    <h1 style="font-size: 1.35rem">Contact (Vue)</h1>
    <p style="color: #444; font-size: 0.95rem; line-height: 1.45">
      Form-first layout: keep the adapter at module scope, require a token before submit, optionally
      POST to the same Express handler used in
      <code>react-contact-server</code>.
    </p>

    <form @submit.prevent="submit()">
      <label style="display: block; font-size: 0.85rem; font-weight: 600">Name</label>
      <input v-model="name" required style="display: block; width: 100%; max-width: 22rem; margin-bottom: 0.65rem; padding: 0.45rem" />

      <label style="display: block; font-size: 0.85rem; font-weight: 600">Email</label>
      <input v-model="email" type="email" required style="display: block; width: 100%; max-width: 22rem; margin-bottom: 0.65rem; padding: 0.45rem" />

      <label style="display: block; font-size: 0.85rem; font-weight: 600">Message</label>
      <textarea v-model="message" required minlength="3" rows="4" style="display: block; width: 100%; max-width: 22rem; margin-bottom: 0.65rem; padding: 0.45rem" />

      <div style="margin: 0.9rem 0">
        <Captcha
          ref="captchaRef"
          :adapter="adapter"
          @success="onCaptchaSuccess"
          @expire="onCaptchaExpire"
          @error="onCaptchaError"
        />
      </div>

      <button
        type="submit"
        :disabled="
          !name.trim() || !email.includes('@') || message.trim().length < 3 || !token || pending
        "
      >
        Send
      </button>
    </form>

    <pre
      v-if="status"
      :style="{
        marginTop: '1rem',
        fontSize: '0.85rem',
        color: status.kind === 'err' ? '#b00020' : status.kind === 'ok' ? '#0d5f2e' : '#333',
        whiteSpace: 'pre-wrap',
      }"
      >{{ status.text }}</pre
    >
  </main>
</template>
