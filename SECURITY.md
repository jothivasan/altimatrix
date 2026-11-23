# Security

## Report a vulnerability privately

On the GitHub repository, open **Security → Report a vulnerability** if the button is available. Include the affected commit or package version, operating system, workflow policy, prerequisites, expected trust boundary and observed impact. Redact tokens, private issue content, checkout paths and personal information from logs.

If private vulnerability reporting is unavailable, use a private contact method published by the maintainer, or open a public issue asking only for a private reporting channel. Keep technical details private until the maintainer and reporter coordinate a fix and disclosure. Include a suggested credit name if you want acknowledgement.

## Versions

Report findings against any affected version and indicate whether they also occur on the current development branch. The project has no published backport schedule or long-term support branches. Check the relevant release notes for the first version containing a fix.

## What operators should know

- Coding agents run as the local account. A worktree, scoped MCP grant or stage permission mode does not isolate the shell. An agent may reach files and an authenticated GitHub CLI available to that account.
- Watched issues are screened by author association and optionally by label. Incoming PR review has an additional decision about executing contributor code. Check the commit and repository when answering a trust gate.
- The local API binds to loopback. The dashboard launcher sets a per-launch token, and its Vite proxy authenticates requests. Keep that proxy local. A manually started factory accepts unauthenticated requests when launched without a token.
- Treat the SQLite database, artifacts, agent sessions and worktrees as private. They may contain issue bodies, conversations and unpublished code. A draft PR is visible to people with repository access.

See the [architecture](ARCHITECTURE.md) for how work reaches a stage and the [CLI guide](packages/core/README.md) for runtime paths and configuration.
