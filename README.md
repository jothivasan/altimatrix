<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/altimatrix-logo-dark.svg">
    <img src="./assets/altimatrix-logo.svg" alt="Altimatrix" width="420">
  </picture>
</h1>

Altimatrix turns a GitHub issue into a reviewed draft pull request on your machine. It is for maintainers who want a coding agent to work through a queue while they retain control over the plan, the diff, and the merge. You can follow a run from the terminal or open the local dashboard to inspect the plan and answer a gate.

## From issue to draft

1. **Intake** polls the repositories you select. By default, open issues from owners, members and collaborators qualify. You can also require a label.
2. **Blueprint** reads the checkout and records a plan and acceptance criteria. Choose **Plan first** to approve them before implementation. **Dispatch first** adds classification before the coding workflow.
3. **Assembly** implements the plan in a Git worktree. The engine commits the changes locally. **Inspection** evaluates that commit from a separate checkout and can request revisions.
4. **Delivery** pushes the branch and opens a draft PR after approval. The factory can continue following check failures and review feedback. It also has a separate review workflow for PRs opened by contributors. A maintainer decides whether to merge.

SQLite tracks the queue, leases, approvals and sessions. Versioned files preserve what each station produced, so a person can see exactly which plan they approved. Git worktrees keep changes separate, but agents run with the local user's shell access. Read the [security model](SECURITY.md) before watching a shared repository.

## Quick start from source

Install Git, Bun and Node (the checkout pins versions in [.bun-version](.bun-version) and [.nvmrc](.nvmrc)). For live runs, install the GitHub CLI and sign in to an ACP-compatible coding agent. The default agent for planning, implementation and review is Codex. Use a GitHub account able to read issues, push branches and open PRs in your chosen repository.

From the workspace root, run:

```sh
bun install --frozen-lockfile
gh auth login
gh auth status
bun run packages/core/src/index.ts doctor
bun run dev:web
```

Open [the dashboard](http://localhost:5173), select **Add repository** on the repositories screen and choose a repository. For a first run, use a test repository and **Plan first**. Open a small, clearly scoped issue after adding the repository, apply the configured label if needed, and queue or start the resulting offer. Approve its plan when prompted and inspect the resulting draft on GitHub. Adding a repository also makes its existing open PRs eligible for review.

For a local smoke test without credentials, run `bun run packages/core/src/index.ts gates` with an empty state directory. An empty gate list on first launch is expected. For terminal operation, headless configuration and macOS launchd, see the [CLI guide](packages/core/README.md).

## Working on Altimatrix

| Start here | What it covers |
| --- | --- |
| [Architecture](ARCHITECTURE.md) | Source map, station boundaries, persistence, PR lifecycle and browser API |
| [Contributing](CONTRIBUTING.md) | Development setup, test selection, CI and pull requests |
| [Agent stations and skills](docs/AGENTS_AND_SKILLS.md) | Agent selection, stage contracts, skill assignment and a working configuration example |
| [CLI reference](packages/core/README.md) | Commands, settings, paths, environment and release workflow |
| [Dashboard](app/web/README.md) | Frontend development, Vite proxy and production build |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Intake, approvals, ports, credentials and recovery |
| [Changelog](CHANGELOG.md) | Unreleased changes and release notes |

The engine uses Bun, TypeScript, Hono, Drizzle SQLite, XState and acpx. The dashboard uses React, Vite, TanStack Router and Query. Run `bun run check` for the same suite used by pull-request CI.

Contributions follow the [code of conduct](CODE_OF_CONDUCT.md). Altimatrix is distributed under the [MIT License](LICENSE).
