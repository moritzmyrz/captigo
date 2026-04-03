<script setup lang="ts">
import { turnstile } from "@captigo/turnstile";
import type { CaptchaInstance, CaptchaToken } from "@captigo/vue";
import { ref } from "vue";

// ---------------------------------------------------------------------------
// Adapters — created once at the module level so the widget is not remounted
// on reactive updates.
// ---------------------------------------------------------------------------

// Managed: visible checkbox, fires automatically.
const managedAdapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  theme: "auto",
});

// Interactive (invisible): no visible widget; call execute() explicitly.
const invisibleAdapter = turnstile({
  siteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
  execution: "execute",
});

// ---------------------------------------------------------------------------
// Managed widget state
// ---------------------------------------------------------------------------

const managedToken = ref<CaptchaToken | null>(null);
const managedStatus = ref("Waiting…");

function onManagedSuccess(token: CaptchaToken) {
  managedToken.value = token;
  managedStatus.value = `Token received (${token.value.slice(0, 12)}…). Would send to server here.`;
}

function onManagedExpire() {
  managedToken.value = null;
  managedStatus.value = "Token expired. Please solve the challenge again.";
}

// ---------------------------------------------------------------------------
// Invisible widget state
// ---------------------------------------------------------------------------

const captchaRef = ref<CaptchaInstance>();
const invisibleStatus = ref("Click 'Submit' to trigger the challenge.");

async function handleInvisibleSubmit() {
  invisibleStatus.value = "Triggering challenge…";
  try {
    const inst = captchaRef.value;
    if (!inst) {
      invisibleStatus.value = "Captcha not ready.";
      return;
    }
    const token = await inst.execute("example-submit");
    invisibleStatus.value = `Token received (${token.value.slice(0, 12)}…). Would send to server here.`;
  } catch {
    invisibleStatus.value = "Challenge failed or was cancelled.";
  }
}
</script>

<template>
  <main style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 0 1rem">
    <h1>captigo — Vue 3 + Turnstile</h1>
    <p>
      This example uses the
      <a href="https://developers.cloudflare.com/turnstile/reference/testing/">
        Turnstile test site key
      </a>
      which always passes. Set <code>VITE_TURNSTILE_SITE_KEY</code> in
      <code>.env.local</code> to use a real key.
    </p>

    <!-- ── Managed widget ───────────────────────────────────────── -->
    <section>
      <h2>Managed widget (visible checkbox)</h2>
      <p>The challenge fires automatically when the user interacts with the widget.</p>

      <Captcha
        :adapter="managedAdapter"
        @success="onManagedSuccess"
        @expire="onManagedExpire"
        @error="(err) => (managedStatus = `Error: ${err.message}`)"
      />

      <p><strong>Status:</strong> {{ managedStatus }}</p>
      <p v-if="managedToken" style="font-family: monospace; font-size: 0.8rem; word-break: break-all">
        Token: {{ managedToken.value }}
      </p>
    </section>

    <hr />

    <!-- ── Invisible widget ──────────────────────────────────────── -->
    <section>
      <h2>Invisible widget (execute on submit)</h2>
      <p>No visible widget is rendered. The challenge fires when you click Submit.</p>

      <form @submit.prevent="handleInvisibleSubmit">
        <!-- Captcha renders an empty container; the adapter ignores its content -->
        <Captcha ref="captchaRef" :adapter="invisibleAdapter" />
        <button type="submit">Submit</button>
      </form>

      <p><strong>Status:</strong> {{ invisibleStatus }}</p>
    </section>
  </main>
</template>
