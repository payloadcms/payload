---
description: Find GitHub discussions resolved by recent releases and draft response comments to inform the community.
argument-hint: <time-period> (default: 2months, e.g., "3months", "6weeks", "2025-11-01")
allowed-tools: Bash(gh release list:*, gh release view:*, gh api graphql:*), Glob, Grep, Read, Write, TodoWrite
---

# Respond to Community

Find open GitHub discussions in "Feature Requests & Ideas" that have been resolved by recent releases, and generate draft comments to post.

## Arguments

- `$ARGUMENTS` - Time period to analyze (default: `2months`)
- Accepts: `Ndays`, `Nweeks`, `Nmonths`, or ISO date `YYYY-MM-DD`

## Process

### Step 1: Setup & Fetch Releases

1. Parse time period from `$ARGUMENTS` (default: 2months)
2. Create TodoWrite with: Fetch releases | Parse release notes | Fetch discussions | Match features to discussions | Generate output
3. Run `gh release list --repo payloadcms/payload --limit 30` to get recent releases
4. Filter to releases within the time period
5. For each release, fetch notes: `gh release view <tag> --repo payloadcms/payload --json body -q '.body'`

### Step 2: Parse Release Notes

1. Extract feature and fix entries from each release:
   - Lines containing `feat:` or `feat(`
   - Lines containing `fix:` or `fix(`
2. For each entry, capture:
   - PR title (the description text)
   - PR number (from `#NNNN` pattern)
   - Package scope if present (from `feat(scope):` pattern)
   - Version it shipped in
3. Build keyword list from titles (feature names, package names, key terms)

### Step 3: Fetch Discussions

1. Use GraphQL to paginate through all open Feature Request discussions:

```
gh api graphql -f query='
{
  repository(owner: "payloadcms", name: "payload") {
    discussions(first: 100, states: OPEN, categoryId: "MDE4OkRpc2N1c3Npb25DYXRlZ29yeTMyMzY4NTUx", orderBy: {field: CREATED_AT, direction: DESC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        url
        createdAt
        body
      }
    }
  }
}'
```

2. Continue paginating with `after: "<endCursor>"` until all discussions fetched
3. Store: number, title, URL, createdAt, body (for matching)

### Step 4: Match Features to Discussions

For each feature/fix from releases:

1. Search discussion titles and bodies for keyword matches
2. Consider semantic variations (e.g., "groupBy" matches "group by", "group-by")
3. Filter: only include if discussion was created BEFORE the feature's release date
4. Score matches by keyword overlap
5. Flag ambiguous matches as "Needs Verification"

Multiple discussions can match the same PR - include all matches.

### Step 5: Generate Output

1. Create output directory if needed: `.claude/artifacts/`
2. Generate markdown file: `.claude/artifacts/community-response-YYYY-MM-DD.md`

**Output structure:**

```markdown
# Community Response: Features Shipped [start date] → [end date]

## Summary

Found **N discussions** resolved by releases vX.XX.X → vX.XX.X

## Matches

| Discussion Title | Discussion Link                                        | PR Title   | PR Link                                         |
| ---------------- | ------------------------------------------------------ | ---------- | ----------------------------------------------- |
| [title]          | https://github.com/payloadcms/payload/discussions/NNNN | [pr title] | https://github.com/payloadcms/payload/pull/NNNN |

## Draft Comments

### 1. [Discussion Title]

**Link:** https://github.com/payloadcms/payload/discussions/NNNN

> [Draft comment]

---
```

**Comment template:**

- Lead with "Shipped in vX.XX.X 🎉" or "Fixed in vX.XX.X 🎉"
- Brief description of what shipped (1-2 sentences)
- Code example if the feature involves configuration
- PR link at the end
- Keep concise: 3-6 lines typical

3. Present summary to user: "Found N matches. Output written to .claude/artifacts/community-response-YYYY-MM-DD.md"

## Edge Cases

| Scenario                             | Action                                        |
| ------------------------------------ | --------------------------------------------- |
| No `$ARGUMENTS`                      | Use default: 2months                          |
| No releases in time period           | Report "No releases found" and stop           |
| No matches found                     | Create output with "No matches found" message |
| API rate limited                     | Report error, suggest waiting and retrying    |
| Ambiguous match                      | Include with "⚠️ Needs Verification" note     |
| Discussion already has team response | Include anyway - human reviewer will skip     |

## Remember

- Create TodoWrite with 5 steps upfront
- Mark steps in_progress before starting, completed after finishing
- Full URLs in output table (not just issue numbers)
- Comments should be helpful and concise
- Better to surface a false positive than miss a real match
- Human will review before posting - don't need to be perfect
- Auto-save to `.claude/artifacts/` directory
