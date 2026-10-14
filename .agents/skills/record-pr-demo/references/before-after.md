# Before and After Recordings

Use this mode only when the user selects **Before and after** or explicitly requests both recordings. Produce two independent MP4s: one showing the PR's base revision and one showing the PR's head revision. Do not stitch them together.

## Select the revisions

Read the PR's actual base and head refs. For a stacked PR, **Before** is the parent PR branch, not necessarily `main`. Pin both revisions while recording so a moving branch does not change the comparison midway. If the intended baseline is unclear, ask which revision should be Before.

Use separate checkouts for the pinned revisions. Preserve existing worktrees and uncommitted changes. Run the same relevant Payload test suite in both, with separate ports and databases. Use the `payload-dev-isolated` skill when available for environment allocation and verification; a different port or checkout alone does not isolate data.

Create or reuse an ignored `.env.local` in **each** checkout. Give each file its own `PORT` and `MONGODB_URL`, with a different database name in the URL path; set `PAYLOAD_DATABASE=mongodb` and `PAYLOAD_DROP_DATABASE=false`. The dev runner loads `.env.local` from its checkout. Preserve any existing local settings, verify the effective adapter, database name, and bound port before recording, and never commit or display the env files. Keep credentials and database URLs out of recordings and manifests.

## Record comparable stories

Plan the same reviewer question, fixture data, viewport, and starting state for both videos. Each checkout must prepare its own fixture and clean it up. The two dev servers may stay running concurrently, but record the videos **sequentially**. Run each scenario against its own server, using `--base-url` and identical `--viewport` values. The recorder can run from the newer checkout against either server; the baseline checkout does not need the latest recording scripts.

Reuse one scenario when the interface supports the same actions. When selectors, navigation, or interactions differ, write separate `/tmp` scenarios for Before and After that demonstrate the same user intent. Each scenario calls `ready()` after its own opening UI is visible and before the first recorded interaction. Assert the relevant end state in each. Do not force a baseline failure into a successful flow; show the pre-change behavior honestly.

Use distinct labels, for example `feature-before-take-1` and `feature-after-take-1`, so candidate MP4s, contact sheets, and manifests cannot overwrite each other. Keep any in-video **Before** or **After** label small and clear of the feature. The PR description also labels the two players.

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate \
  --scenario /tmp/payload-pr-demo-before.mjs \
  --base-url http://localhost:3101 \
  --viewport 1440x900 \
  --label feature-before-take-1

node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate \
  --scenario /tmp/payload-pr-demo-after.mjs \
  --base-url http://localhost:3102 \
  --viewport 1440x900 \
  --label feature-after-take-1
```

The URLs are examples; use the allocated ports. Review both complete MP4s locally and provide both paths and SHA-256 digests to the user. If one needs another take, keep the other reviewed candidate intact. Upload nothing until the user has approved the exact bytes of both videos.

## Publish the pair

After approval, follow [publishing.md](publishing.md). Verify both manifests immediately before upload. Preserve the existing PR body and append one `## Preview` section with `Before:` and `After:` labels, each followed by its own video reference in a separate paragraph. Upload the two approved files with repeated `--attach` flags, then confirm that both players render. A partial upload is not completion: inspect the PR body and retry only the missing approved file without duplicating the first.
