# Publishing an Approved Demo

Read this reference only after the user explicitly approves the final local MP4.

## Verify the approved bytes

Verify the saved candidate manifest immediately before upload:

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs verify \
  --manifest /tmp/payload-pr-demo-feature.json
```

This recomputes the SHA-256 digest and file size for the manifest's MP4. If verification fails, do not upload. Show the changed file and request approval again.

Confirm `gh auth status` succeeds and that the installed GitHub CLI command supports `--attach`. If it does not, use available browser automation to attach the approved local file through GitHub's PR description editor. Use the comment editor only when the user explicitly requests a comment. If the environment cannot select a local file, give the approved MP4 to the user for manual drag-and-drop into the same destination; do not commit it or substitute a release, LFS, or repository URL.

## Append to the PR description by default

Read the complete current body with `gh pr view <number-or-url> --json body` and save it before editing. Preserve that body verbatim, including all existing sections, links, and attachments. Append blank lines followed by this final section, keeping the video reference alone in its paragraph:

```md
## Preview

![](/absolute/path/to/payload-pr-demo-feature.mp4)
```

Write the complete combined body to `/tmp/payload-pr-body-with-demo.md`. Re-read the remote body immediately before editing; if it changed, rebuild the combined body from the latest version so concurrent edits are preserved. Do not replace an existing preview or remove existing content without explicit instructions.

```bash
gh pr edit <number-or-url> \
  --body-file /tmp/payload-pr-body-with-demo.md \
  --attach /absolute/path/to/payload-pr-demo-feature.mp4
```

GitHub CLI replaces the local reference with the uploaded attachment URL so it renders as an inline player. With browser automation, append the same `## Preview` section to the existing description and attach the approved MP4 beneath it.

## Use a comment only when explicitly requested

For an explicitly requested comment, create `/tmp/payload-pr-demo-comment.md` with a video reference alone in its paragraph:

```md
## Preview

![](/absolute/path/to/payload-pr-demo-feature.mp4)
```

```bash
gh pr comment <number-or-url> \
  --body-file /tmp/payload-pr-demo-comment.md \
  --attach /absolute/path/to/payload-pr-demo-feature.mp4
```

## Verify and clean up

Re-read the PR description and confirm the saved existing body is intact and the final `## Preview` section contains the uploaded attachment in its own paragraph. Open the PR and confirm the inline player renders at the bottom of the description. For an explicitly requested comment, verify its player in that comment instead. Do not treat a successful command exit as sufficient proof.

After verification, remove temporary body snapshots, combined body/comment files, scenario, plan, raw WebM, and recording-only fixtures. Preserve the approved MP4 until the upload and rendering are confirmed; remove it afterward only if the user does not want to keep it. Check `git status --short` and confirm no recording artifacts or temporary config changes remain.
