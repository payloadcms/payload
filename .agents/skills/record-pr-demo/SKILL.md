---
name: record-pr-demo
description: Use when a Payload pull request needs a concise visual walkthrough for reviewers.
---

# Record a PR Demo

Create short, reviewer-focused screen recordings of a Payload feature. Produce and review every video locally before uploading anything to GitHub.

This skill is for feature demonstrations, not committed screenshot regression baselines.

## Non-negotiable review gate

Uploading consumes GitHub storage and changes an external PR. Always stop after rendering the local MP4s, show those exact files to the user, and request approval for each one. A general request to “record and post a demo” does not waive this checkpoint.

Before showing each video, record its absolute path and SHA-256 digest. Immediately before an approved upload, recompute each digest. If one changed, show that video again and request approval again.

Do not upload previews, rejected takes, raw WebM recordings, or files the user has not reviewed. Never commit demo media to the repository.

## Workflow

1. If the user has not chosen a recording mode, ask once: **After only** (recommended) or **Before and after**. Use Codex's native multiple-choice input when available; otherwise ask in plain text. Wait for the selection before recording, and do not ask again when the user has already specified a mode. Before and after means two separate videos, not a combined or split-screen video. Follow [before-after.md](references/before-after.md) for that mode.
2. Inspect the feature, relevant diff, and available test configs. Choose the smallest existing Payload config that demonstrates the real feature. Create a temporary config only when no existing config can show it clearly.
3. Write a brief plan in `/tmp` with the opening state, 2–6 visible actions, and the final proof a reviewer should see. For editorial annotations, use the [recording.md style specification](references/recording.md#editorial-annotations-over-the-recording).
4. Start the relevant dev server and make its initial state deterministic. Do not expose credentials, personal data, tokens, or unrelated records.
5. Read [recording.md](references/recording.md) and create a temporary scenario module in `/tmp`. Call `ready()` once after the opening UI is visible; this marks where the finished video starts. Put deterministic recording-only data in optional scenario `setup` and `teardown` exports instead of recreating it manually between takes.
6. Use a take-specific label and run the candidate command from the repository root, for example `node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate --scenario /tmp/payload-pr-demo-feature.mjs --label feature-take-1`. It performs preflight checks, fast validation, human-paced recording, conversion, full decode verification, contact-sheet generation, hashing, manifest creation, and raw-video cleanup. Keep each demo concise enough to stay below the converter's default 10 MB budget.
7. Watch every MP4, use its contact sheet for a quick state check, and show each exact local video inline using its absolute path:

   ```md
   ![Feature demo](/absolute/path/to/payload-pr-demo-feature.mp4)
   ```

8. Stop and ask the user to approve, reject, or request another take. Do not call `gh`, open an upload UI, or otherwise upload any video yet.
9. Only after explicit approval of every recording to be uploaded, read [publishing.md](references/publishing.md) and verify each reviewed manifest. Preserve the complete existing PR description and append a final `## Preview` section with each approved video in its own paragraph. Use a PR comment only when the user explicitly asks for one.
10. Verify the PR renders every uploaded video, then remove temporary scenarios, plans, raw recordings, and temporary fixture changes. Preserve the approved MP4s until the uploads are confirmed.

## Completion criteria

- The recording tells one understandable visual story and ends on visible proof.
- The first decoded frame shows the intended opening UI, without a blank startup screen.
- Pointer movement is smooth, clicks have readable dwell time, and the cursor stays visible above popup menus and dialogs.
- Editorial annotations follow the [recording.md style specification](references/recording.md#editorial-annotations-over-the-recording) and leave important UI visible.
- Overflowing content, including popup menu lists, uses the scenario `scroll` helper for paced movement.
- The approved artifact is an H.264 `.mp4`, within GitHub's applicable upload limit.
- Each candidate command produced a contact sheet and manifest, and each manifest still matches before upload.
- The user reviewed the exact bytes of every uploaded video.
- The existing PR description is preserved and ends with `## Preview` and the approved inline players, unless the user explicitly requested a comment.
- GitHub contains no rejected or superseded takes.
- No media or recording-only fixture remains in the working tree.

Explicit user instructions about the feature, scenario, length, destination, or presentation override this skill's preferences, except that upload still requires review of the final file.
