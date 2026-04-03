import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  // @captigo/shared is private and must be bundled — do not add it to external.
  external: ["@captigo/core"],
});
