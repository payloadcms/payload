---
name: audit-dependencies
description: Use when fixing dependency vulnerabilities, running pnpm audit, or when the audit-dependencies CI check fails
user-invocable: true
disable-model-invocation: true
argument-hint: "critical|high|moderate|low"
---

# Audit Dependencies

## Overview

Fix dependency vulnerabilities reported by `.github/workflows/audit-dependencies.sh`. Always prefer direct dependency bumps over pnpm overrides. Every override requires justification for why a direct bump isn't feasible.

## Core Workflow

```dot
digraph audit {
    "Run audit script" [shape=box];
    "Group by package" [shape=box];
    "Trace dependency chain" [shape=box];
    "Can bump direct dep?" [shape=diamond];
    "Research breaking changes" [shape=box];
    "Breaking changes acceptable?" [shape=diamond];
    "Apply direct bump" [shape=box];
    "Apply pnpm override" [shape=box];
    "More packages?" [shape=diamond];
    "Install and verify" [shape=box];
    "Build and verify" [shape=box];
    "Commit and create PR" [shape=box];

    "Run audit script" -> "Group by package";
    "Group by package" -> "Trace dependency chain";
    "Trace dependency chain" -> "Can bump direct dep?";
    "Can bump direct dep?" -> "Research breaking changes" [label="yes"];
    "Can bump direct dep?" -> "Apply pnpm override" [label="no - explain why"];
    "Research breaking changes" -> "Breaking changes acceptable?";
    "Breaking changes acceptable?" -> "Apply direct bump" [label="yes"];
    "Breaking changes acceptable?" -> "Apply pnpm override" [label="no - explain why"];
    "Apply direct bump" -> "More packages?";
    "Apply pnpm override" -> "More packages?";
    "More packages?" -> "Trace dependency chain" [label="yes"];
    "More packages?" -> "Install and verify" [label="no"];
    "Install and verify" -> "Build and verify";
    "Build and verify" -> "Commit and create PR";
}
```

## Step-by-Step

### 1. Run the Audit Script

```bash
./.github/workflows/audit-dependencies.sh $ARGUMENTS
```

`$ARGUMENTS` is the severity passed to the skill (defaults to `high` if omitted). The script runs `pnpm audit --prod --json` and filters for actionable vulnerabilities (those with a patched version available). `high` includes `critical`.

Parse the output to build a deduplicated list of vulnerable packages with:

- Package name and current version
- Fixed version requirement
- Full dependency chain (e.g., `packages/plugin-sentry > @sentry/nextjs > rollup`)

### 2. For Each Vulnerable Package

#### Trace the dependency chain

Identify whether the vulnerable package is:

- **Direct dependency**: Listed in a workspace package's `package.json`
- **Transitive dependency**: Pulled in by another package

#### Try direct bump first

For transitive deps, walk up the chain to find the nearest package you control:

1. Check if bumping the **parent package** resolves the vulnerability
   - `pnpm view <parent>@latest dependencies.<vulnerable-pkg>`
   - Check intermediate versions too (the fix may exist in a minor bump)
2. If the parent bump resolves it, research breaking changes:
   - Check changelogs/release notes
   - Search GitHub issues for compatibility problems
   - Review the API surface used in this repo (read the source files)
   - Check if the version range crosses a major version boundary
3. Present findings to user with risk assessment

**Parallelize research**: When multiple packages need breaking change analysis, dispatch parallel agents (one per package) to research simultaneously.

#### Fall back to override only when justified

Add a scoped pnpm override in root `package.json` only when:

- No version of the parent package fixes the vulnerability
- The parent bump has high breaking change risk (major API changes, no test coverage, requires code changes across many files)
- The user explicitly decides to defer the parent bump to a separate PR

Override format: `"<parent>><vulnerable-pkg>": "<fixed-version>"`

Before adding any override, verify the target version exists:

```bash
pnpm view <pkg>@<version> version
```

### 3. Apply Fixes

- Edit `package.json` files for direct bumps
- Edit root `package.json` `pnpm.overrides` for overrides (keep alphabetical)
- If a direct bump changes behavior, update consuming code (e.g., adding `allowOverwrite: true` when an API default changes)

### 4. Install and Verify

```bash
pnpm install
```

If install fails due to native build errors (e.g., `better-sqlite3`), fall back to:

```bash
pnpm install --ignore-scripts
```

Then re-run the audit script with the same severity:

```bash
./.github/workflows/audit-dependencies.sh $ARGUMENTS
```

The audit script must exit 0. If vulnerabilities remain, check for additional instances of the same dependency in other workspace packages.

### 5. Build and Verify

```bash
pnpm run build:core
```

For packages with changed dependencies, also run their specific build:

```bash
pnpm run build:<package-name>
```

### 6. Look Up CVEs

For each fixed vulnerability, find the GitHub Security Advisory (GHSA):

- Check `https://github.com/<org>/<repo>/security/advisories` for each package
- Search the web for `<package-name> GHSA <fixed-version>`
- Record: GHSA ID, CVE ID, severity, one-line description
- Prefer GHSA links (`https://github.com/advisories/GHSA-xxxx-xxxx-xxxx`) over NVD links

**Parallelize CVE lookups**: Dispatch parallel agents to search for CVEs across all packages simultaneously.

### 7. Commit and Create PR

Commit with conventional commit format:

```
fix(deps): resolve $ARGUMENTS severity audit vulnerabilities
```

Create PR using `gh pr create` with this body structure:

```markdown
# Overview

[What the PR fixes, mention `pnpm audit --prod`]

## Key Changes

- **[Package name] in [workspace path]**
  - [old version] → [new version]. Fixes [GHSA-xxxx-xxxx-xxxx](https://github.com/advisories/GHSA-xxxx-xxxx-xxxx) ([description]).
  - [Why this approach: direct bump because X / override because Y]
  - [Any code changes required by the bump]

## Design Decisions

[Why direct bumps were preferred, justification for any remaining overrides]
```

## Common Mistakes

| Mistake                                 | Fix                                                                                                                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Jumping straight to overrides           | Always check if bumping the parent resolves it first                                                                    |
| Not checking all workspace packages     | Same dep may appear in multiple `package.json` files (e.g., `changelogen` in both `tools/releaser` and `tools/scripts`) |
| Overriding with a nonexistent version   | Verify the target version exists with `pnpm view` before installing                                                     |
| Not falling back to `--ignore-scripts`  | Pre-existing native build failures block `pnpm install`; use `--ignore-scripts` to get lockfile updated                 |
| Missing code changes for breaking bumps | If a bump changes API defaults, update the calling code                                                                 |
| Forgetting advisory links in PR         | Always look up and include GHSA links for each vulnerability                                                               |
