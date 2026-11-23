# Troubleshooting Altimatrix

| Symptom | What to check |
| --- | --- |
| Doctor cannot check GitHub, or the repository picker is empty | Run `gh --version` and `gh auth status` in the shell that starts Altimatrix. Use `gh repo view OWNER/REPO` with the intended repository to check which account can see it. |
| No run appears for an issue | Confirm the repository is watched. The first poll looks back ten minutes. Create or update an open issue from an eligible account and apply its required label. Later passes use the saved cursor. |
| Discovered work stays offered | Queue or start the offer. Discovery records the issue or PR without spending an agent turn. |
| Work is queued but does not start | Check whether the queue is paused or all run slots are occupied. The factory defaults to two concurrent runs. |
| A run stops after writing a plan | Inspect the open gate and its version. Plan-first and conversational modes wait for a decision. From the root, run `bun run packages/core/src/index.ts gates` to list pending decisions. |
| Doctor passes but a station fails to start | Doctor checks GitHub, Git and settings. Check the configured station agent and its own authentication in the same shell. Read the failed attempt in the run detail. |
| The dashboard launcher reports another factory or a 401 | Check which process owns the API port with `lsof -nP -iTCP:4173 -sTCP:LISTEN`. To reuse an existing factory, give the launcher its matching `ALTIMATRIX_API_URL` and `ALTIMATRIX_API_TOKEN`. Vite itself requires port 5173. |
| A run was interrupted | Restart the factory with the same state and workbench directories. The poller tries unfinished runs first. Keep the snapshot, database and worktree together for recovery. |
| The background service stops polling overnight | The optional service uses macOS launchd. Polling resumes when the machine wakes. |

For a bug report, include the command, working directory, Bun and Node versions, stage and policy. Share a short redacted log excerpt. Use [private reporting](../SECURITY.md) for a suspected trust-boundary failure.
