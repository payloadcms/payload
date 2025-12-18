---
description: Triage a GitHub issue and present findings on validity, code locations, and optionally create a failing test or resolution plan.
argument-hint: <issue-number-or-url>
allowed-tools: Bash(gh issue view:*), Task, TodoWrite, Write, AskUserQuestion
---

# Triage GitHub Issue

Quickly triage GitHub issues to determine validity and identify where the issue exists in code. Do not write code during triage.

## Process

### Step 1: Validate & Fetch

1. Check if `$ARGUMENTS` provided - if missing, ask user and stop
2. Create TodoWrite with: Fetch and validate issue data | Investigate codebase | Analyze validity and generate report | Offer next steps
3. Fetch issue data: `gh issue view $ARGUMENTS --json author,title,number,body,comments,labels,url`
4. If command fails: Inform user and stop
5. Extract title, body, comments, labels, state, URL
6. Verify issue has sufficient info to investigate

### Step 2: Investigate

1. Use Task tool with subagent_type=Explore to examine relevant parts of codebase
2. Think step by step through the code paths involved until you understand the relevant files, functions, and logic
3. Focus on understanding the problem space before judging validity

### Step 3: Analyze & Report

1. Think step by step about whether this issue is valid - be critical and consider alternative explanations
2. Determine verdict: Valid | Invalid | Needs Info
3. Determine confidence: High | Medium | Low
4. If valid: Think deeply about the root cause before proposing fix direction
5. Generate findings using output structure below
6. Auto-save to `.claude/artifacts/triage-<issue-number>.md`
7. Present findings to user

### Step 4: Offer Next Steps

Use AskUserQuestion with multiSelect: true:

"What would you like to do next?"

- **Create failing test** - Write integration test that reproduces the issue
- **Create resolution plan** - Generate full plan using `/superpowers:write-plan`
- **Done for now** - End triage

If user selects test: Write an integration test that reproduces the issue.
If user selects plan: Use `/superpowers:write-plan` to create detailed implementation plan.

## Output Structure

```markdown
# Triage: #<issue-number> - <title>

**Verdict:** Valid | Invalid | Needs Info
**Confidence:** High | Medium | Low

## Problem

1-2 sentences on what's broken and why.

## Reproduction

Steps to reproduce from investigation:

1. ...
2. ...

## Code Locations

- `path/file.ts:123` - what's here
- `path/other.ts:456` - related

## Fix Direction

Brief hints on potential approach (not full plan):

- Consider X
- May need to change Y

## Issue Link

<url>
```

## When to Stop

**STOP immediately when:**

- `$ARGUMENTS` not provided (ask for it)
- `gh issue view` command fails
- Issue not found or inaccessible
- Cannot understand issue after investigation
- Insufficient information to determine validity

**Ask for clarification rather than guessing.**

## Remember

- Create TodoWrite with 4 steps upfront
- Mark steps in_progress before starting, completed after finishing
- Use Explore agent for investigation
- Be critical about issue validity
- Auto-save findings to `.claude/artifacts/`
- Single question at end with multi-select options
- DO NOT write code during triage (tests come after, if requested)
- Stop when blocked, don't guess
