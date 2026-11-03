# .github — Agent Guidance

## Pinning actions

Pin every non-local action to a full 40-character commit SHA, with its exact version tag as a comment:

```yaml
# BAD - a tag can be moved to point at different code
- uses: actions/checkout@v5

# GOOD
- uses: actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09 # v5.1.0
```

- Get the SHA from the real tag, never from memory: `gh api repos/<owner>/<repo>/commits/<tag> --jq .sha`. Use the most specific tag (`v5.1.0`, not `v5`) in the comment.
- CI checks this with [zizmor](https://docs.zizmor.sh) in the `lint` job (config: `.github/zizmor.yml`). Run it locally with the `version` from that job: `GH_TOKEN=$(gh auth token) uvx zizmor@1.31.1 .github`
