---
name: release
description: Use when an authorized maintainer wants to cut, publish, or ship a Payload release to npm, or asks how releases work.
---

# Release Payload

Only `denolfe` and `DanRibbens` can dispatch a release. Anyone else should ask one of them.

| Line      | Branch | npm dist-tag |
| --------- | ------ | ------------ |
| v4 beta   | `main` | `beta`       |
| v3 stable | `3.x`  | `latest`     |

On `3.x`, the one-click flow requires [#18717](https://github.com/payloadcms/payload/pull/18717). Until it lands, v3 releases run locally with `pnpm release --tag latest`.

## Steps

1. **Start it.** Actions > `release-bump` > Run workflow, from the branch above, with bump `auto`. Use `dry_run` to preview the version first. A different bump fails unless you fill in `override_reason`.
2. **Wait for `publish-release`.** The tag push starts it, and its log ends with the draft release URL. If it fails, re-run the failed job: it resumes and skips packages already on npm. Never dispatch `release-bump` again for the same release, since that bumps to a new version.
3. **Review the draft.** Optionally add highlights at the top.
4. **Publish the draft.** For a v3 release after v4 GA, make sure **Set as the latest release** is unticked.
5. **Merge the templates PR.** Publishing starts `post-release-templates`, which opens a `templates: bump for vX` PR.

Security releases follow their own process and are out of scope here.
