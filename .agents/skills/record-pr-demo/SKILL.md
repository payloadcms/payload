---
name: record-pr-demo
description: Use when a Payload pull request needs a concise visual walkthrough for reviewers.
---

# Record a PR Demo

Create a short, reviewer-focused screen recording of the current Payload feature. Produce and review the video locally before uploading anything to GitHub.

This skill is for feature demonstrations, not committed screenshot regression baselines.

## Non-negotiable review gate

Uploading consumes GitHub storage and changes an external PR. Always stop after rendering the local MP4, show that exact file to the user, and request approval. A general request to “record and post a demo” does not waive this checkpoint.

Before showing the video, record its absolute path and SHA-256 digest. Immediately before an approved upload, recompute the digest. If it changed, show the new video and request approval again.

Do not upload previews, rejected takes, raw WebM recordings, or files the user has not reviewed. Never commit demo media to the repository.

## Workflow

1. Inspect the feature, relevant diff, and available test configs. Choose the smallest existing Payload config that demonstrates the real feature. Create a temporary config only when no existing config can show it clearly.
2. Write a brief plan in `/tmp` with the opening state, 2–6 visible actions, and the final proof a reviewer should see. Default to one current-state feature demo; create Before/After recordings only when requested.
3. Start the relevant dev server and make its initial state deterministic. Do not expose credentials, personal data, tokens, or unrelated records.
4. Read [recording.md](references/recording.md) and create a temporary scenario module in `/tmp`. Put deterministic recording-only data in optional scenario `setup` and `teardown` exports instead of recreating it manually between takes.
5. Use a take-specific label and run the candidate command from the repository root, for example `node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate --scenario /tmp/payload-pr-demo-feature.mjs --label feature-take-1`. It performs preflight checks, fast validation, human-paced recording, conversion, full decode verification, contact-sheet generation, hashing, manifest creation, and raw-video cleanup. Keep the demo concise enough to stay below the converter's default 10 MB budget.
6. Watch the entire MP4, use the contact sheet for a quick state check, and show the exact local video inline using its absolute path:

   ```md
   ![Feature demo](/absolute/path/to/payload-pr-demo-feature.mp4)
   ```

7. Stop and ask the user to approve, reject, or request another take. Do not call `gh`, open an upload UI, or otherwise upload the file yet.
8. Only after explicit approval of that recording, read [publishing.md](references/publishing.md) and verify the reviewed manifest. Preserve the complete existing PR description and append a final `## Preview` section with the approved video in its own paragraph. Use a PR comment only when the user explicitly asks for one.
9. Verify the PR renders the uploaded video, then remove temporary scenarios, plans, raw recordings, and temporary fixture changes. Preserve the approved MP4 until the upload is confirmed.

## Completion criteria

- The recording tells one understandable visual story and ends on visible proof.
- Pointer movement is smooth, clicks have readable dwell time, and the cursor does not jump between interactions.
- The approved artifact is an H.264 `.mp4`, within GitHub's applicable upload limit.
- The candidate command produced a contact sheet and manifest, and the manifest still matches before upload.
- The user reviewed the exact bytes that were uploaded.
- The existing PR description is preserved and ends with `## Preview` and the approved inline player, unless the user explicitly requested a comment.
- GitHub contains no rejected or superseded takes.
- No media or recording-only fixture remains in the working tree.

Explicit user instructions about the feature, scenario, length, destination, or presentation override this skill's preferences, except that upload still requires review of the final file.
