---
name: e2e-pr-assets
description: Use when a PR needs before/after admin UI evidence from e2e tests, either videos or screenshots, attached to the PR body
---

# E2E PR Media

## Overview

Captures and attaches **Before/After** media to the PR body in this format:

### Before

<!-- hidden plan comment copied from the local Before section -->
<media>

### After

<!-- hidden plan comment copied from the local After section -->
<media>

Supports two modes:

- `video` (default): GitHub-inline H.264 `.mp4` links
- `screenshot`: embedded PNG images

This project bundle has no required sub-skills. It requires the helper scripts in `tools/e2e-pr-assets/bin`.

## Required Recording Plan

Before recording any media, write a temporary local plan outside the repo, for example:

- `~/.copilot/session-state/<session>/recordings/pr-<pr-number>/recording-plan.md`

This plan is for the agent first. Its `Before` and `After` section contents may be copied into the final PR body only as hidden HTML comments under the matching headings, so reviewers do not see them unless they inspect the PR body in edit mode.

The plan must have separate `Before` and `After` sections and should answer:

- What exact UI story the video must tell, in order
- Which actions must be visible on screen
- What proof must be visible at the end of the `Before` run
- What proof must be visible at the end of the `After` run
- What must be shown in card view
- What must be shown in list view

Use this template:

```md
# PR <number> Recording Plan

## Before
- Steps:
- Final visible proof:
- Card view must show:
- List view must show:

## After
- Steps:
- Final visible proof:
- Card view must show:
- List view must show:
```

Do not start recording until the plan is specific enough that another agent could follow it without guessing.

## Requirements

- `gh` authenticated for the target repo
- `pnpm` + project deps installed
- `node_modules` present for the target worktree/repo
- `jq` installed
- For video mode: `ffmpeg`, `ffprobe`, `bc`
- From repo root, run a check-first bootstrap:
  - `bash tools/e2e-pr-assets/check.sh`
  - If check fails, run `bash tools/e2e-pr-assets/install.sh`, then rerun `bash tools/e2e-pr-assets/check.sh`
- Before relying on `e2e-run --record`, inspect the repo's Playwright config:
  - If the config hardcodes `video: 'off'` or otherwise ignores `PLAYWRIGHT_VIDEO`, do not spend time fighting the suite recorder.
  - Prefer `e2e-run-script` for video capture in that case.
- Helper commands installed by the bundle:
  - `e2e-infer-suite`
  - `e2e-run`
  - `e2e-run-script`
  - `e2e-convert-video`
  - `e2e-upload-github-attachments`
  - `e2e-capture-screenshot`
  - `e2e-attach-pr`

## Video Mode Workflow

### Preferred: focused `_community` evidence fixture

Use this path when the relevant e2e suite is noisy, has unrelated fields, or would make the evidence harder to understand. The goal is a minimal admin surface that shows only the behavior the PR fixes.

1. Add a temporary, focused fixture to `test/_community`:
   - Create a collection/global under `test/_community/collections/` or `test/_community/globals/`.
   - Wire it into `test/_community/config.ts`.
   - Add only fields needed for the evidence. For example, for localized draft bugs: localized `title` plus one non-localized shared field.
   - Add seed data in `onInit` only when the video needs a pre-existing document.
2. Start the community dev server:
   - `pnpm run dev _community`
3. Write the local recording plan described above.
4. Generate a temporary scenario script outside the repo:
   - `~/.copilot/session-state/<session>/recordings/pr-<pr-number>/scenario.mjs`
   - Do not commit this script.
   - Mirror the `Before` / `After` steps from the recording plan in a top-of-file comment so the scenario explains the intended visible story.
5. Run/record the scenario with `e2e-run-script`.
   - Record "before" against the buggy/unfixed state.
   - Record "after" against the fixed state.
   - Use the same fixture data and scenario steps for both recordings.
   - Recorded runs include a visible in-page cursor overlay. Normal `page.click`, `page.fill`, `locator.click`, and `locator.fill` calls move it automatically; scenarios can also use the provided `cursor` helper for deliberate pointer movement before an explanatory pause.
   - If the video goal includes comparing card view and list view, make both views explicit in the plan and the scenario; do not assume one implies the other.
6. After recording, remove every temporary `_community` collection/config/seed edit before finalizing:
   - `git --no-pager diff -- test/_community`
   - The diff must be empty unless the PR intentionally changes `_community`.
   - Also check full repo status because Payload test/dev commands can rewrite `tsconfig.base.json` aliases:
     - `git --no-pager diff -- tsconfig.base.json`
     - `git --no-pager status --short`
   - Do not leave evidence-only fixtures in the PR.

### Alternative: agent-generated recording scenario against existing config

Use this path when the committed e2e suite is too CI-focused, too brittle for evidence, or would require adding video-only behavior to tests. The user should describe the evidence they want; the agent writes the scenario.

Prefer this path early when the goal is explanatory evidence, not just pass/fail proof. If the video needs to clearly tell a story in the UI, use a scenario instead of forcing the committed suite to double as a demo.

1. Infer the suite/config context from the PR:
   - `e2e-infer-suite <pr-number> <owner/repo> --repo <repo-root>`
2. Write the local recording plan described above.
3. Generate a temporary scenario script outside the repo, for example:
   - `~/.copilot/session-state/<session>/recordings/pr-<pr-number>/scenario.mjs`
   - Do not commit this script.
   - Add a top-of-file comment with separate `Before` and `After` shot lists copied from the plan.
4. The scenario must export a function:

```js
export default async function scenario({ baseURL, cursor, expect, label, page, record, repoRoot }) {
  // Seed data, log in, navigate the admin UI, and perform the exact evidence flow.
  // Optional: await cursor?.moveTo('#important-field') before pausing for emphasis.
}
```

5. If the scenario mutates document data outside the open edit view, avoid stale-data modal churn:
   - Prefer seeding and local API mutations before opening the document page when possible.
   - If you must mutate via local API while the document page is already open, reload the page before continuing visible interactions.

6. Dry-run and iterate until the script works:
   - `e2e-run-script <scenario.mjs> --repo <repo-root> --label before --base-url http://localhost:3000`
   - Dry-run success means the visible end state matches the recording plan for that label, not merely that the script exits successfully.
7. Record before/after:
   - `e2e-run-script <scenario.mjs> --repo <repo-root> --label before --record`
   - `e2e-convert-video before`
   - `e2e-run-script <scenario.mjs> --repo <repo-root> --label after --record`
   - `e2e-convert-video after`
8. Continue with MP4 verification and GitHub attachment upload below.

### Existing committed e2e suite

1. Infer suite from the PR, and if a touched e2e test exists, start there:
   - `e2e-infer-suite <pr-number> <owner/repo> --repo <repo-root>`
   - First result is the default suite candidate.
2. Write the local recording plan described above, even if you are reusing a committed e2e test.
3. Write/confirm regression e2e test included in the PR.
4. Dry-run before (no recording) and confirm it fails:
   - `e2e-run <suite> --repo <repo-root>`
   - A passing dry-run is not enough for recording readiness; the suite must visibly cover the planned `Before` proof.
5. Record before (unless already cached and no re-record requested):
   - `e2e-run <suite> --record --label before --repo <repo-root>`
   - `e2e-convert-video before`
   - If no fresh `.webm` is produced, stop assuming the suite recorder works in this repo and switch to `e2e-run-script`.
6. Apply fix.
7. Dry-run after (no recording) and confirm it passes:
   - `e2e-run <suite> --repo <repo-root>`
   - The suite must visibly cover the planned `After` proof before you accept the recording.
8. Record after and convert:
   - `e2e-run <suite> --record --label after --repo <repo-root>`
   - `e2e-convert-video after`
9. Verify MP4 outputs before attaching:
   - `/tmp/payload-e2e-before.mp4` and `/tmp/payload-e2e-after.mp4` exist and are non-empty.
   - `ffprobe` reports `codec_name=h264` for both.
   - Do not attach `.webm` files; GitHub does not render them inline in PR bodies.
   - Do not use raw GitHub, release asset, or Git LFS URLs for video mode; GitHub treats them as normal links.
   - Do not switch to screenshots unless the user explicitly changes the requested mode.
10. Upload through GitHub's attachment UI to get `https://github.com/user-attachments/assets/...` URLs:
   - `e2e-upload-github-attachments <pr-number> <owner/repo> /tmp/payload-e2e-before.mp4 /tmp/payload-e2e-after.mp4`
   - If the configured browser profile is not signed in, the script automatically opens the login flow, waits for manual sign-in detection, then retries upload once.
   - Optional profile override: `GITHUB_BROWSER_PROFILE=/path/to/profile`
   - To disable automatic login flow, set `E2E_GITHUB_AUTO_LOGIN=0`.
11. Attach the returned user-attachment URLs to the PR body:

- `urls=$(e2e-upload-github-attachments <pr-number> <owner/repo> /tmp/payload-e2e-before.mp4 /tmp/payload-e2e-after.mp4)`
- `e2e-attach-pr <pr-number> <owner/repo> --mode video --before-url "$(jq -r .before <<<"$urls")" --after-url "$(jq -r .after <<<"$urls")" --plan-file /path/to/recording-plan.md`
- `e2e-attach-pr` copies the `Before` and `After` sections from the plan file into hidden HTML comments directly below the visible `### Before` and `### After` headings.
- Video mode is not complete until the PR body uses `github.com/user-attachments/assets` URLs.

## Screenshot Mode Workflow

1. Infer suite from the PR, and if a touched e2e test exists, start there:
   - `e2e-infer-suite <pr-number> <owner/repo> --repo <repo-root>`
2. Capture/export before screenshot to `/tmp/payload-e2e-before.png`:
   - `e2e-capture-screenshot before --source <path/to/before.png>`
   - or `e2e-capture-screenshot before --repo <repo-root>` (uses newest PNG in `test-results`)
3. Apply fix and capture/export after screenshot:
   - `e2e-capture-screenshot after --source <path/to/after.png>`
4. Attach:
   - `e2e-attach-pr <pr-number> <owner/repo> --mode screenshot`

## Notes

- Use this bootstrap guard before running media commands:

```bash
if ! bash tools/e2e-pr-assets/check.sh; then
  bash tools/e2e-pr-assets/install.sh
  bash tools/e2e-pr-assets/check.sh
fi
```

- `e2e-attach-pr` is idempotent: it replaces the prior generated media block instead of duplicating it.
- The recording plan remains a local, temporary planning artifact. When attaching media, pass it to `e2e-attach-pr --plan-file ...` so the `Before` and `After` notes land in hidden PR-body comments instead of visible reviewer-facing text.
- Video conversion records at full viewport size, trims the initial blank Playwright lead-in by default (including longer startup blanks when a later first scene is detected), and auto-compresses to fit GitHub upload constraints when needed.
- If `e2e-convert-video` fails with `h264_videotoolbox`, retry conversion with `libx264` instead of re-recording. Hardware H.264 availability is not the same as hardware H.264 reliability.
- Video mode is complete only when the PR body contains `github.com/user-attachments/assets` video links. `.webm` links or raw `.mp4` links are failed video-mode results.
- Media artifacts are stored in `/tmp` and are automatically removed after `e2e-attach-pr` completes by default. Disable with `E2E_MEDIA_AUTO_CLEANUP=0`.
- Payload dev/test commands may rewrite `tsconfig.base.json` aliases such as `@payload-config`. After recording, restore that drift before finalizing.
- Never store PR evidence media in repository branches such as `.github/e2e-assets/...` or `e2e-assets-<pr>`. Those commits pollute the PR timeline and file list. If GitHub attachment upload fails, fix the upload flow instead of committing media files.
