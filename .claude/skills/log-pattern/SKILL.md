---
name: log-pattern
description: Add code patterns to .claude/guide/ - captures bad vs good examples with explanations
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# Log Pattern to Guide

## Overview

Capture code quality issues as reusable patterns in `.claude/guide/`. Prompts for category, bad code, good code, and explanation, then appends to the appropriate markdown file.

## When to Use

- User runs `/log-pattern`
- User says "log this pattern" with code examples
- After code review feedback about patterns

## Workflow

1. Prompt for pattern details using AskUserQuestion
2. Determine target file (existing or new)
3. Append pattern in standard format
4. Confirm addition to user

---

## Step 1: Discover Existing Categories

Use Glob to find all existing pattern files:

```
Glob pattern: ".claude/guide/**/*.md"
```

Parse filenames to extract categories for the dropdown:

- `.claude/guide/config/translation-patterns.md` → "Translation (config)"
- `.claude/guide/ui/react-patterns.md` → "React (ui)"
- `.claude/guide/code-quality/yagni-violations.md` → "YAGNI (code-quality)"

Add "New Category" as the last option.

---

## Step 2: Collect Pattern Details

Use AskUserQuestion to gather:

```json
{
  "questions": [
    {
      "question": "Which category does this pattern belong to?",
      "header": "Category",
      "multiSelect": false,
      "options": [
        { "label": "[Existing categories from Step 1]", "description": "Add to existing file" },
        { "label": "New Category", "description": "Create a new pattern file" }
      ]
    }
  ]
}
```

If "New Category" selected, ask follow-up:

```json
{
  "questions": [
    {
      "question": "What should the new category be called?",
      "header": "Category Name",
      "multiSelect": false,
      "options": [
        {
          "label": "Enter category name",
          "description": "E.g., 'State Management', 'Hooks', 'Types'"
        }
      ]
    },
    {
      "question": "Which directory should this go in?",
      "header": "Directory",
      "multiSelect": false,
      "options": [
        { "label": "config", "description": "Configuration patterns" },
        { "label": "ui", "description": "UI/React patterns" },
        { "label": "code-quality", "description": "Code quality patterns" },
        { "label": "testing", "description": "Testing patterns" }
      ]
    }
  ]
}
```

Then collect the pattern content:

**Bad Code Example:** Prompt user to paste bad code
**Good Code Example:** Prompt user to paste good code
**Explanation:** Prompt user for why explanation (include references if applicable)

---

## Step 3: Determine Target File

**If existing category selected:**

- Use the file path from Step 1 category mapping

**If new category:**

- Generate filename: `{directory}/{category-slug}-patterns.md`
- Example: "State Management" in "ui" → `.claude/guide/ui/state-management-patterns.md`

---

## Step 4: Format and Append Pattern

**If file doesn't exist**, create it with header:

```markdown
# {Category Name} Patterns
```

**Append new pattern:**

````markdown
## Pattern: {Brief description inferred from good/bad code}

❌ **Bad:**

```{detected-language}
{bad code example}
```
````

✅ **Good:**

```{detected-language}
{good code example}
```

💡 **Why:** {explanation}

---

```

Use Write tool for new files, Edit tool to append to existing files.

---

## Step 5: Confirm Addition

After writing:

```

✓ Pattern added to .claude/guide/{directory}/{filename}.md

You can view it with:
Read .claude/guide/{directory}/{filename}.md

Or find related patterns:
Glob .claude/guide/\*_/_{topic}\*.md

```

---
```
