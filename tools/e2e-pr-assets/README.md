# e2e-pr-assets bundle

This folder packages the `e2e-pr-assets` skill and its helper scripts so teammates can use the same workflow from this repository.

## What is included

- Project skill: `.claude/skills/e2e-pr-assets/SKILL.md`
- Helper scripts: `tools/e2e-pr-assets/bin/e2e-*`
- Bootstrap scripts:
  - `tools/e2e-pr-assets/install.sh`
  - `tools/e2e-pr-assets/check.sh`
- Bundle manifest: `tools/e2e-pr-assets/bundle.json`

## Setup

From the repository root:

```bash
bash tools/e2e-pr-assets/check.sh
```

If the check fails, install then re-check:

```bash
bash tools/e2e-pr-assets/install.sh
bash tools/e2e-pr-assets/check.sh
```

The install script links helper commands into `~/.local/bin` (or `$XDG_BIN_HOME`) and validates prerequisites.

## Validate manually

```bash
bash tools/e2e-pr-assets/check.sh
```

Before spending time recording media, proactively ensure the GitHub browser profile is signed in for the target PR:

```bash
e2e-ensure-github-auth <pr-number> <owner/repo> --repo /path/to/repo
```

If the selected browser profile is unsigned, the helper opens the login flow immediately so the upload step does not interrupt the workflow later.

## Recording Plan

Before recording, create a temporary local `recording-plan.md` outside the repo with separate `Before` and `After` sections.

- Keep this plan out of the visible PR body.
- List the visible step order for each pass.
- State exactly what must be proven in card view and in list view.
- Mirror the same `Before` / `After` plan in a top-of-file comment in any temporary `scenario.mjs`.
- When attaching media, pass the plan to `e2e-attach-pr --plan-file ...` so the `Before` and `After` notes become hidden HTML comments below the matching headings.
- In those hidden comments, call out the verdict explicitly: `Before` should name the incorrect result, and `After` should name the correct result.

## Pacing

Keep recordings brisk overall, then slow down only around the proof beats:

- pause after the important UI state becomes visible
- pause before the key action if the current state matters
- pause after the result appears so the reviewer can read it

If a scenario feels too fast, prefer rewriting the flow or adding 2-4 short proof-beat pauses over making the entire recording uniformly slow.

## New-tab behaviors

`e2e-run-script` can now stitch together page-content recordings across multiple tabs/pages in the same scenario. It still cannot capture the browser tab strip or browser chrome, so it cannot literally show the tab appearing in the browser UI.

For new-tab proof:

- detect the new page with `browserContext.waitForEvent('page')`
- if you will interact with that page in the recording, wait for recorder setup with `video.waitForPage(newPage)`
- keep a short proof-beat pause on the opened page so the destination is readable in the stitched output
- verify the destination URL or visible content
- use a small overlay such as `New tab opened` only after the page event is observed
- do not fake the behavior by navigating the current page in-place

## Notes

- The scripts are repository-local and can be versioned/reviewed via PR.
- The install script creates symlinks rather than copying files, so updates in this repo are immediately reflected.
- Default security behavior:
  - Browser auth profile defaults to `/tmp/github-upload-profile`.
  - Temporary browser profile is removed automatically after upload flow unless explicitly disabled.
  - Temporary media artifacts are removed automatically after `e2e-attach-pr` updates the PR body.
- `e2e-ensure-github-auth` is the proactive auth check:
  - Use it before recording to confirm the selected browser profile is already signed in for the target PR.
  - If not signed in, it opens `e2e-github-login-profile` immediately and waits for sign-in detection before returning.
  - Add `--check-only` to fail fast without opening the login flow.
- `e2e-upload-github-attachments` is check-first for auth:
  - Uses an ephemeral profile by default: `/tmp/github-upload-profile`.
  - Calls `e2e-ensure-github-auth` at the start so missing GitHub sign-in is discovered before upload begins.
  - If the selected browser profile is already signed in to GitHub, upload proceeds immediately.
  - If not signed in, it opens `e2e-github-login-profile`, waits for manual sign-in detection, then retries upload once automatically.
  - On completion (success/failure), it removes temporary profile directories by default for security.
  - Override profile with `GITHUB_BROWSER_PROFILE=/path/to/profile`.
  - Disable auto-removal with `E2E_GITHUB_AUTO_REMOVE_PROFILE=0`.
  - For non-temporary custom paths, removal is skipped unless `E2E_GITHUB_FORCE_REMOVE_PROFILE=1`.
  - Disable auto-open behavior with `E2E_GITHUB_AUTO_LOGIN=0`.
- `e2e-attach-pr` cleans `/tmp/payload-e2e-before|after.{mp4,webm,png}` after a successful PR body update by default.
  - Disable media cleanup with `E2E_MEDIA_AUTO_CLEANUP=0`.
- `e2e-attach-pr --plan-file /path/to/recording-plan.md` copies the plan's `Before` and `After` sections into hidden HTML comments in the PR body, directly below the visible `### Before` and `### After` headings.
- Prefer final proof lines like `Show the document card with the published title. (Incorrect, should be draft title)` and `Show the document card with the draft title. (Correct, shows draft title)` so the hidden comments explain the bug/fix clearly in edit mode.
- If the first scenario technically proves the behavior but reads too fast, prefer rewriting the flow or adding proof-beat pauses over making the whole recording uniformly slow.
- If the behavior opens a new browser tab, remember that the recorder can stitch the page-content clips but still cannot show the browser tab strip itself. Prove the event through `browserContext.waitForEvent('page')`, `video.waitForPage(newPage)` when needed, the opened page destination, and a small overlay if needed.
- `e2e-convert-video` trims the initial blank lead-in by default and can extend that trim automatically when the first meaningful scene change happens later than the standard 1-second startup buffer.
- When the opening poster matters, inspect the first decoded MP4 frame after conversion and before upload. The first frame should already be meaningful UI, not a white loading spinner or blank transition frame.
- If `h264_videotoolbox` is available but fails during conversion, `e2e-convert-video` automatically retries with `libx264`.
