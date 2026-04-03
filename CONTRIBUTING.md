# Contributing to Captigo

Thanks for your interest in contributing. This document covers everything you need to get started.

## Prerequisites

- [Node.js](https://nodejs.org) >= 20
- [pnpm](https://pnpm.io) >= 9

## Setup

```bash
git clone https://github.com/moritzmyrz/captigo.git
cd captigo
pnpm install
```

## Development workflow

| Command | What it does |
|---|---|
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Run TypeScript type checking across all packages |
| `pnpm lint` | Run Biome linter |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm format` | Format all files with Biome |
| `pnpm test` | Run all tests |
| `pnpm changeset` | Add a changeset for a versioned change |

## Project structure

```
captigo/
├── packages/          # Published npm packages
│   ├── core/          # @captigo/core — types and adapter interface
│   ├── turnstile/     # @captigo/turnstile
│   ├── hcaptcha/      # @captigo/hcaptcha
│   ├── recaptcha/     # @captigo/recaptcha
│   ├── react/         # @captigo/react
│   ├── vue/           # @captigo/vue
│   ├── nextjs/        # @captigo/nextjs — App Router / Request helpers
│   └── shared/        # @captigo/shared — internal utilities (not published)
├── examples/          # Runnable example applications
└── docs/              # Documentation guides
```

## Making changes

1. Fork the repo and create a branch from `main`.
2. Make your changes. Keep them focused — one logical change per PR.
3. Make sure `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass.
4. Add a [changeset](https://github.com/changesets/changesets) if your change affects a published package: `pnpm changeset`.
5. Open a pull request using the provided template.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org). Examples:

```
feat(turnstile): add retry configuration option
fix(hcaptcha): handle token expiry correctly
docs: update contributing guide
chore: bump deps
```

## Adding a new provider

Provider packages live under `packages/`. Each provider should:

- Implement the `CaptchaAdapter` interface from `@captigo/core`
- Be named `@captigo/<provider-name>`
- Include its own `README.md` with usage examples
- Bundle internal utilities (do not list `@captigo/shared` as a runtime dependency)
- Export a clean API surface — factory function, config type, `verifyToken`, `preloadScript`

## Questions

Open a [GitHub Discussion](https://github.com/moritzmyrz/captigo/discussions) rather than an issue for questions.
