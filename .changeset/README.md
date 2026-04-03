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
2. The CI release job detects pending changesets and opens (or updates) a "Release" PR.
3. When the Release PR is merged, packages are versioned and published to npm automatically.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.
