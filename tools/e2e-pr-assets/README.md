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

## Notes

- The scripts are repository-local and can be versioned/reviewed via PR.
- The install script creates symlinks rather than copying files, so updates in this repo are immediately reflected.
- Default security behavior:
  - Browser auth profile defaults to `/tmp/github-upload-profile`.
  - Temporary browser profile is removed automatically after upload flow unless explicitly disabled.
  - Temporary media artifacts are removed automatically after `e2e-attach-pr` updates the PR body.
- `e2e-upload-github-attachments` is check-first for auth:
  - Uses an ephemeral profile by default: `/tmp/github-upload-profile`.
  - If the selected browser profile is already signed in to GitHub, upload proceeds immediately.
  - If not signed in, it opens `e2e-github-login-profile`, waits for manual sign-in detection, then retries upload once automatically.
  - On completion (success/failure), it removes temporary profile directories by default for security.
  - Override profile with `GITHUB_BROWSER_PROFILE=/path/to/profile`.
  - Disable auto-removal with `E2E_GITHUB_AUTO_REMOVE_PROFILE=0`.
  - For non-temporary custom paths, removal is skipped unless `E2E_GITHUB_FORCE_REMOVE_PROFILE=1`.
  - Disable auto-open behavior with `E2E_GITHUB_AUTO_LOGIN=0`.
- `e2e-attach-pr` cleans `/tmp/payload-e2e-before|after.{mp4,webm,png}` after a successful PR body update by default.
  - Disable media cleanup with `E2E_MEDIA_AUTO_CLEANUP=0`.
