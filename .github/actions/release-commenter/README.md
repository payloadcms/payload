# Release Commenter

This GitHub Action automatically comments on and/or labels Issues and PRs when a fix is released for them.

> [!IMPORTANT]
> 🔧 Heavily modified version of https://github.com/apexskier/github-release-commenter

## Fork Modifications

- Filters to closed PRs only
- Adds tag filter to support non-linear releases
- Better logging
- Moved to pnpm
- Uses @vercel/ncc for packaging
- Comments on locked issues by unlocking then re-locking

## How it works

Use this action in a workflow [triggered by a release](https://docs.github.com/en/free-pro-team@latest/actions/reference/events-that-trigger-workflows#release). It will scan commits between that and the prior release, find associated Issues and PRs, and comment on them to let people know a release has been made. Associated Issues and PRs can be directly [linked](https://docs.github.com/en/free-pro-team@latest/github/managing-your-work-on-github/linking-a-pull-request-to-an-issue) to the commit or manually linked from a PR associated with the commit.

## Inputs

**GITHUB_TOKEN**

A GitHub personal access token with repo scope, such as [`secrets.GITHUB_TOKEN`](https://docs.github.com/en/free-pro-team@latest/actions/reference/authentication-in-a-workflow#about-the-github_token-secret).

**comment-template** (optional)

Override the comment posted on Issues and PRs. Set to the empty string to disable commenting. Several variables strings will be automatically replaced:

- `{release_link}` - a markdown link to the release
- `{release_name}` - the release's name
- `{release_tag}` - the release's tag

**label-template** (optional)

Add the given label. Multiple labels can be separated by commas. Several variable strings will be automatically replaced:

- `{release_name}` - the release's name
- `{release_tag}` - the release's tag

**skip-label** (optional)

Skip processing if any of the given labels are present. Same processing rules as **label-template**. Default is "dependencies".

## Example

```yml
on:
  release:
    types: [published]

jobs:
  release:
    steps:
      - uses: apexskier/github-release-commenter@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          comment-template: |
            Release {release_link} addresses this.
```

## Known limitations

These are some known limitations of this action. I'd like to try to address them in the future.

- Non-linear releases aren't supported. For example, releasing a patch to a prior major release after a new major release has been bumped.
- Non-sequential releases aren't supported. For example, if you release multiple prereleases between two official releases, this will only create a comment for the first prerelease in which a fix is released, not the final release.
- The first release for a project will be ignored. This is intentional, as the use case is unlikely. Most projects will either have several alphas that don't need release comments, or won't use issues/PRs for the first commit.
- If a large number of things are commented on, you may see the error `Error: You have triggered an abuse detection mechanism. Please wait a few minutes before you try again.`. Consider using the `skip-label` input to reduce your load on the GitHub API.

## Versions

Workflows will automatically update the tags `v1` and `latest`, allowing you to reference one of those instead of locking to a specific release.
