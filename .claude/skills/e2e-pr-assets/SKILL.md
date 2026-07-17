---
name: e2e-pr-assets
description: Use when a PR needs before/after admin UI evidence from e2e tests, either videos or screenshots, attached to the PR body
---

# E2E PR Media

## Overview

Captures and attaches **Before/After** media to the PR body in this format:

### Before

<media>

### After

<media>

Supports two modes:

- `video` (default): GitHub-inline H.264 `.mp4` links
- `screenshot`: embedded PNG images

This project bundle has no required sub-skills. It requires the helper scripts in `tools/e2e-pr-assets/bin`.

## Requirements

- `gh` authenticated for the target repo
- `pnpm` + project deps installed
- `jq` installed
- For video mode: `ffmpeg`, `ffprobe`, `bc`
- From repo root, run a check-first bootstrap:
  - `bash tools/e2e-pr-assets/check.sh`
  - If check fails, run `bash tools/e2e-pr-assets/install.sh`, then rerun `bash tools/e2e-pr-assets/check.sh`
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
3. Generate a temporary scenario script outside the repo:
   - `~/.copilot/session-state/<session>/recordings/pr-<pr-number>/scenario.mjs`
   - Do not commit this script.
4. Run/record the scenario with `e2e-run-script`.
   - Record "before" against the buggy/unfixed state.
   - Record "after" against the fixed state.
   - Use the same fixture data and scenario steps for both recordings.
   - Recorded runs include a visible in-page cursor overlay. Normal `page.click`, `page.fill`, `locator.click`, and `locator.fill` calls move it automatically; scenarios can also use the provided `cursor` helper for deliberate pointer movement before an explanatory pause.
5. After recording, remove every temporary `_community` collection/config/seed edit before finalizing:
   - `git --no-pager diff -- test/_community`
   - The diff must be empty unless the PR intentionally changes `_community`.
   - Also check full repo status because Payload test/dev commands can rewrite `tsconfig.base.json` aliases:
     - `git --no-pager diff -- tsconfig.base.json`
     - `git --no-pager status --short`
   - Do not leave evidence-only fixtures in the PR.

### Alternative: agent-generated recording scenario against existing config

Use this path when the committed e2e suite is too CI-focused, too brittle for evidence, or would require adding video-only behavior to tests. The user should describe the evidence they want; the agent writes the scenario.

1. Infer the suite/config context from the PR:
   - `e2e-infer-suite <pr-number> <owner/repo> --repo <repo-root>`
2. Generate a temporary scenario script outside the repo, for example:
   - `~/.copilot/session-state/<session>/recordings/pr-<pr-number>/scenario.mjs`
   - Do not commit this script.
3. The scenario must export a function:

```js
export default async function scenario({ baseURL, cursor, expect, label, page, record, repoRoot }) {
  // Seed data, log in, navigate the admin UI, and perform the exact evidence flow.
  // Optional: await cursor?.moveTo('#important-field') before pausing for emphasis.
}
```

4. Dry-run and iterate until the script works:
   - `e2e-run-script <scenario.mjs> --repo <repo-root> --label before --base-url http://localhost:3000`
5. Record before/after:
   - `e2e-run-script <scenario.mjs> --repo <repo-root> --label before --record`
   - `e2e-convert-video before`
   - `e2e-run-script <scenario.mjs> --repo <repo-root> --label after --record`
   - `e2e-convert-video after`
6. Continue with MP4 verification and GitHub attachment upload below.

### Existing committed e2e suite

1. Infer suite from the PR, and if a touched e2e test exists, start there:
   - `e2e-infer-suite <pr-number> <owner/repo> --repo <repo-root>`
   - First result is the default suite candidate.
2. Write/confirm regression e2e test included in the PR.
3. Dry-run before (no recording) and confirm it fails:
   - `e2e-run <suite> --repo <repo-root>`
4. Record before (unless already cached and no re-record requested):
   - `e2e-run <suite> --record --label before --repo <repo-root>`
   - `e2e-convert-video before`
5. Apply fix.
6. Dry-run after (no recording) and confirm it passes:
   - `e2e-run <suite> --repo <repo-root>`
7. Record after and convert:
   - `e2e-run <suite> --record --label after --repo <repo-root>`
   - `e2e-convert-video after`
8. Verify MP4 outputs before attaching:
   - `/tmp/payload-e2e-before.mp4` and `/tmp/payload-e2e-after.mp4` exist and are non-empty.
   - `ffprobe` reports `codec_name=h264` for both.
   - Do not attach `.webm` files; GitHub does not render them inline in PR bodies.
   - Do not use raw GitHub, release asset, or Git LFS URLs for video mode; GitHub treats them as normal links.
   - Do not switch to screenshots unless the user explicitly changes the requested mode.
9. Upload through GitHub's attachment UI to get `https://github.com/user-attachments/assets/...` URLs:
   - `e2e-upload-github-attachments <pr-number> <owner/repo> /tmp/payload-e2e-before.mp4 /tmp/payload-e2e-after.mp4`
   - Requires a signed-in browser profile. If needed, set `GITHUB_BROWSER_PROFILE=/path/to/profile`.
10. Attach the returned user-attachment URLs to the PR body:

- `urls=$(e2e-upload-github-attachments <pr-number> <owner/repo> /tmp/payload-e2e-before.mp4 /tmp/payload-e2e-after.mp4)`
- `e2e-attach-pr <pr-number> <owner/repo> --mode video --before-url "$(jq -r .before <<<"$urls")" --after-url "$(jq -r .after <<<"$urls")"`
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
- Video conversion records at full viewport size, trims the initial blank Playwright frame by default, and auto-compresses to fit GitHub upload constraints when needed.
- Video mode is complete only when the PR body contains `github.com/user-attachments/assets` video links. `.webm` links or raw `.mp4` links are failed video-mode results.
- Media artifacts are stored in `/tmp` for session-scoped use.
- Never store PR evidence media in repository branches such as `.github/e2e-assets/...` or `e2e-assets-<pr>`. Those commits pollute the PR timeline and file list. If GitHub attachment upload fails, fix the upload flow instead of committing media files.
