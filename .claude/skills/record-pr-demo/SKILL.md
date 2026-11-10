---
name: record-pr-demo
description: Use when a Payload pull request needs a concise visual walkthrough for reviewers.
---

# Record a PR Demo

The canonical skill lives on `payloadcms/payload`'s remote `main` branch at `.agents/skills/record-pr-demo`. This forwarding skill keeps 3.x on the current recording workflow without maintaining a second copy.

For **every new request to record a demo**, including another request in the same chat:

1. From the current Payload repository/worktree root, run `node .claude/skills/record-pr-demo/scripts/load-main.mjs`. It checks remote main every time and prints JSON containing `revision`, `skillDirectory`, `skillFile`, and `entrypoint`. If refreshing fails, stop and report the error; do not reuse earlier instructions or a cached revision silently.
2. Read the returned `skillFile` again, even if you already loaded this skill earlier in the chat. Follow that fetched version and read its references relative to `skillDirectory`.
3. Wherever the fetched instructions use `.agents/skills/record-pr-demo` or `.claude/skills/record-pr-demo`, substitute the returned absolute `skillDirectory`. Run commands with the current worktree as the working directory and use its dev server and dependencies. For example, invoke `node <entrypoint> candidate --scenario /tmp/demo.mjs --label feature-take-1`.
4. Keep that exact snapshot for the whole recording, review, and upload. Refresh for the next new demo request, not between steps or takes within the current request. Never modify cached snapshots. Make future skill changes on main.

The loader requires Git, remote access, and installed dependencies in the current project (`pnpm install`). Snapshots are cached by commit beneath `node_modules/.cache/payload-record-pr-demo/`; unchanged revisions reuse their files after checking main. The cache is disposable.

The fetched skill's requirement to show the final video and obtain approval before uploading still applies. Loading this skill does not authorize an upload.
