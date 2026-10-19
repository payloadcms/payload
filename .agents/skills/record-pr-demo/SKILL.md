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

## Gesture-based scenarios

Drive the application through browser gestures: paced pointer clicks, keystrokes, and wheel scrolling. Open the starting URL once, then navigate through visible controls. Use existing seeded data when possible. Optional `setup`/`teardown` hooks may seed and clean up recording-only data through the API outside the walkthrough. Within the scenario, use gestures to reach each demonstrated state; avoid API or Local API calls, direct navigation between steps, field filling, DOM mutations, and programmatic scrolling. Assertions and read-only DOM inspection may observe the result. Recording chrome, encoding, and verification remain harness operations. See [recording.md](references/recording.md#gesture-based-interactions) for the interaction contract and examples.

## Required presentation chrome

Every scenario must export `presentation` with a change kind (`Feature` or `Fix`), title, and description. Read [window-chrome.md](references/window-chrome.md) and use the shared component and live preview; do not invent wrapper CSS. Recordings, screenshot previews, and validation always mount the chrome. Keep the change description constant and use `showAnnotation({ title, body, index, total })` / `hideAnnotation()` for panel notes. Floating annotations and placement options (`type`, `position`, `width`) are unsupported. Use `resizeWindow` only when responsive reflow is part of the story.

## Accessibility demonstrations

Set `presentation.accessibility: true` to show brief navigation/shortcut keycaps centered just below the window chrome and a supplemental outline around the actual focused element. Add `presentation.showAnnouncements: true` only when the demo needs observed live-region captions below the application. Use this for keyboard and announcement demonstrations; see [recording.md](references/recording.md#accessibility-observations). Captions are DOM observations, not synthesized speech or evidence of what a screen reader announces. Leave the mode off for ordinary visual demos.

## Workflow

1. Inspect the feature, relevant diff, and available test configs. Choose the smallest existing Payload config that demonstrates the real feature. Create a temporary config only when no existing config can show it clearly.
2. Write a brief plan in `/tmp` with the opening state, 2–6 visible actions, and the final proof a reviewer should see. Default to one current-state feature demo; create Before/After recordings only when requested. For editorial annotations, use the [recording.md style specification](references/recording.md#editorial-annotations-over-the-recording).
3. Start the relevant dev server and make its initial state deterministic. Do not expose credentials, personal data, tokens, or unrelated records.
4. Read [recording.md](references/recording.md) and create a temporary scenario module in `/tmp`. Write readable, multi-line JavaScript with clear preparation and visible-step sections so the script is easy to review. Call `ready()` once after the opening UI is visible; this marks where the finished video starts. Make preparation repeatable so validation and recording each begin in the same state. Use optional `setup`/`teardown` hooks for API fixtures, or prepare content through the UI before `ready()`. Keep recording-only data in a disposable database. If creating content is part of the story, show that creation through the Admin.
5. Use a take-specific label and run the candidate command from the repository root, for example `node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs candidate --scenario /tmp/payload-pr-demo-feature.mjs --label feature-take-1`. It performs preflight checks, fast validation, human-paced recording, conversion, full decode verification, contact-sheet generation, hashing, manifest creation, and raw-video cleanup. Keep the demo concise enough to stay below the converter's default 10 MB budget.
6. Watch the entire MP4, use the contact sheet for a quick state check, and show the exact local video inline using its absolute path. Include a clickable link to its take-specific `.scenario.mjs` snapshot beside the video and open that file in the Codex editor when available:

   ```md
   ![Feature demo](/absolute/path/to/payload-pr-demo-feature.mp4)

   [Review recording script](/absolute/path/to/payload-pr-demo-feature.scenario.mjs)
   ```

7. Stop and ask the user to approve, reject, or request another take. Do not call `gh`, open an upload UI, or otherwise upload the file yet.
8. Only after explicit approval of that recording, read [publishing.md](references/publishing.md) and verify the reviewed manifest. Preserve the complete existing PR description and append a final `## Preview` section with the approved video in its own paragraph. Use a PR comment only when the user explicitly asks for one.
9. Verify the PR renders the uploaded video, then remove temporary scenarios, plans, raw recordings, and temporary fixture changes. Preserve the approved MP4 and its script snapshot until the upload is confirmed.

## Completion criteria

- The recording tells one understandable visual story and ends on visible proof.
- The recorded walkthrough uses browser gestures; optional API fixtures establish only its starting data and clean up afterward.
- The first decoded frame shows the intended opening UI, without a blank startup screen.
- Pointer movement is smooth, clicks have readable dwell time and visible ring feedback, and the cursor stays visible above popup menus and dialogs.
- Editorial annotations follow the [recording.md style specification](references/recording.md#editorial-annotations-over-the-recording) and leave important UI visible.
- Overflowing content, including popup menu lists, uses the scenario `scroll` helper for paced movement.
- The approved artifact is an H.264 `.mp4`, within GitHub's applicable upload limit.
- The candidate command produced a contact sheet, manifest, and take-specific script snapshot. The video review includes a link to that script, and the manifest still matches before upload.
- The user reviewed the exact bytes that were uploaded.
- The existing PR description is preserved and ends with `## Preview` and the approved inline player, unless the user explicitly requested a comment.
- GitHub contains no rejected or superseded takes.
- No media or recording-only fixture remains in the working tree.

Explicit user instructions about the feature, scenario, length, destination, or presentation override this skill's preferences, except that upload still requires review of the final file.
