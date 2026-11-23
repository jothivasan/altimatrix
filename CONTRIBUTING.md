# Contributing to Altimatrix

Start by identifying which part of a run you want to change. Issue selection belongs in the poller, plan or review transitions in the state machines, approval decisions in gates, and browser presentation in the dashboard. The [architecture map](ARCHITECTURE.md) links each responsibility to source.

## Set up a working copy

Fork the project on GitHub, clone your fork, and create a topic branch from the current upstream `main`. From the root, install dependencies with `bun install --frozen-lockfile`. Use the versions in [.bun-version](.bun-version) and [.nvmrc](.nvmrc) when reproducing a tooling problem. The core and web packages share [bun.lock](bun.lock). Make dependency changes from the workspace and include the updated lockfile.

The test suites use temporary state, fixtures and local services. Running the HTTP tests requires permission to bind a loopback port. A live GitHub account and a signed-in agent are needed for a real issue-to-PR run. For first-time setup and starting the dashboard, see the [quick start](README.md#quick-start-from-source).

## Choose a check

Run these commands from the root:

| Command | Use it for |
| --- | --- |
| `bun run test` | Unit and integration behavior, including SQLite, trust screening, routes and scoped MCP tools |
| `bun run eval` | Workflow behavior with a controlled agent harness, including restarts, revisions and gates |
| `bun run typecheck` | Type compatibility in both workspaces |
| `bun run --filter altimatrix-web build` | Dashboard routes, assets and production bundling |
| `bun run --filter altimatrix e2e` | Gate decisions exercised through the local machine, API and CLI |
| `bun run check` | Biome, both typechecks, tests, evals and Fallow, as in PR CI |

Use two spaces and follow [Biome](biome.json) for TypeScript formatting, import order and lint rules. Keep a regression test beside the relevant suite. For example, a queue change should exercise duplicate observations or lease loss where relevant. A new stage transition should have an eval showing what the factory actually does. Edit route files under `app/web/src/routes` and let the router regenerate its route tree.

## Open an issue or pull request

Use the bug, feature or documentation form under **Issues → New issue**. Include the station, policy and expected result when relevant. Report sensitive findings through [Security](SECURITY.md).

Keep each branch focused on one change. Use conventional commit subjects such as `fix(queue): preserve the lease on retry` or `docs(cli): explain plan approval`. The [release notes configuration](cliff.toml) groups commits by prefix. Open your PR against `main`, explain the behavior change and list the checks you ran. Include an image for a visible dashboard change when it helps reviewers. PR CI references the `ci-approval` environment, so a run may wait for a maintainer.

When updating documentation, verify commands from the stated directory and compare defaults with the settings schema. Put a CLI detail in the package guide and link to it from the overview when needed. Record user-facing changes under [Unreleased](CHANGELOG.md#unreleased).
