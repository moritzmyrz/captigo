import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Use explicit imports from vitest (no globals) to keep tests explicit.
    globals: false,
  },
});
