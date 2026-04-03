# Changesets

This directory contains changeset files used by [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## How to add a changeset

When you make a change that affects a published package, run:

```bash
pnpm changeset
```

Follow the interactive prompts to select the packages you changed and describe the change. This creates a new Markdown file here. Commit it with your PR.

## Release process

1. A contributor opens a PR and runs `pnpm changeset`.
2. Manually or via automation: merge the version bump (`pnpm changeset version`), commit, then publish.

**Publishing from your machine**

```bash
pnpm install
pnpm build
pnpm exec changeset publish
```

If your npm account uses 2FA, pass a one-time password (same as `npm publish --otp`):

```bash
pnpm exec changeset publish --otp=123456
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.
