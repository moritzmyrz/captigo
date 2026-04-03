# Examples

Minimal but runnable example applications demonstrating captigo in real setups.

| Example | Stack | What it shows |
|---------|-------|---------------|
| [`react-turnstile`](./react-turnstile) | Vite + React 18 | Managed and invisible Turnstile widgets with `@captigo/react` |
| [`vue-turnstile`](./vue-turnstile) | Vite + Vue 3 | Same patterns using `@captigo/vue` composables |
| [`server-verify`](./server-verify) | Node.js + Express | Server-side verification for all three providers |

## Running any example

```bash
# Install all workspace dependencies (from repo root)
pnpm install

# Run a specific example
pnpm --filter @captigo-examples/react-turnstile dev
pnpm --filter @captigo-examples/vue-turnstile dev
pnpm --filter @captigo-examples/server-verify dev
```

All examples reference workspace packages via `workspace:*` — no need to publish anything first.
