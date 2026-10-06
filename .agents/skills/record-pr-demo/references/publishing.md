# Publishing an Approved Demo

Read this reference only after the user explicitly approves the final local MP4.

## Verify the approved bytes

Verify the saved candidate manifest immediately before upload:

```bash
node .agents/skills/record-pr-demo/scripts/prepare-demo.mjs verify \
  --manifest /tmp/payload-pr-demo-feature.json
```

This recomputes the SHA-256 digest and file size for the manifest's MP4. If verification fails, do not upload. Show the changed file and request approval again.

Confirm `gh auth status` succeeds and that the installed GitHub CLI command supports `--attach`. If it does not, use available browser automation to attach the approved local file through GitHub's PR comment editor. If the environment cannot select a local file, give the approved MP4 to the user for manual drag-and-drop; do not commit it or substitute a release, LFS, or repository URL.

## Attach as a PR comment

A comment is the default because it avoids rewriting an existing PR description. Create a temporary Markdown file whose video reference is alone in its paragraph:

```md
### Feature demo

![](/absolute/path/to/payload-pr-demo-feature.mp4)
```

Then attach the same local path:

```bash
gh pr comment <number-or-url> \
  --body-file /tmp/payload-pr-demo-comment.md \
  --attach /absolute/path/to/payload-pr-demo-feature.mp4
```

GitHub CLI replaces the local reference with the uploaded attachment URL so it renders as an inline player.

## Attach to the PR body

Only edit the PR body when the user asks. Read the current body first, preserve all existing content, add a concise demo section with the approved local video reference in its own paragraph, and use:

```bash
gh pr edit <number-or-url> \
  --body-file /tmp/payload-pr-body-with-demo.md \
  --attach /absolute/path/to/payload-pr-demo-feature.mp4
```

## Verify and clean up

Open or read the PR after upload and confirm the attachment renders in the requested location. Do not treat a successful command exit as sufficient proof.

After verification, remove the temporary comment/body file, scenario, plan, raw WebM, and recording-only fixtures. Remove the local MP4 only if the user does not want to keep it. Check `git status --short` and confirm no recording artifacts or temporary config changes remain.
