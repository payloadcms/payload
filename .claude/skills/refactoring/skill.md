---
name: refactoring
description: Systematic approach to refactoring code - analyzes data flow, plans changes, prevents duplication
allowed-tools: Read, Edit, Glob, Grep, TodoWrite, Bash
---

# Refactoring Skill

## Overview

Enforce a systematic approach to refactoring that prevents common mistakes like duplicated logic, broken data flow, or unnecessary prop passing. This skill requires analyzing the current implementation before making changes.

## When to Use

- User explicitly asks to refactor code
- You're about to move logic between components
- You're changing how data flows through components
- You're extracting or combining functions
- You're simplifying component props or interfaces

**Examples:**

- "Refactor this component to use hooks instead of classes"
- "Move this logic into a shared utility"
- "Simplify the props being passed to this component"
- "Extract this repeated code into a helper"

## Critical Rules

1. **NEVER start refactoring without completing Step 1 (Analysis)**
2. **ALWAYS use TodoWrite to plan the refactor in Step 2**
3. **ALWAYS verify no duplicate logic in Step 4**
4. **If you skip a step, STOP and restart from Step 1**

---

## Step 1: Analyze Current Implementation

Before touching ANY code, document the current state.

### 1.1 Trace Data Flow

Answer these questions by reading the code:

1. **Where is data computed?** (which component/function creates the data)
2. **How is it passed?** (props, context, imports, global state)
3. **Who consumes it?** (which components use this data)
4. **Is it transformed along the way?** (any intermediate processing)

**Example:**

```
groups computation:
- Computed in: DefaultNav component (line 50)
- Passed to: SidebarTabs via props
- Used by: CollectionsTab to render nav items
- No transformations between DefaultNav → SidebarTabs → CollectionsTab
```

### 1.2 Document Dependencies

List all files involved and their relationships:

```
DefaultNav (server component)
  ├─ computes groups from collections/globals
  ├─ passes groups to SidebarTabs
  └─ passes navPreferences to SidebarTabs

SidebarTabs (server component)
  ├─ receives groups, navPreferences
  ├─ passes to CollectionsTab
  └─ renders custom tabs

CollectionsTab (server wrapper)
  ├─ receives groups, navPreferences
  └─ passes to CollectionsTabClient

CollectionsTabClient (client component)
  └─ renders groups with NavGroup components
```

### 1.3 Identify Duplication

Search for duplicate logic:

1. Use Grep to find where the same functions are called multiple times
2. Look for repeated computations with same inputs
3. Check if data is being re-fetched or recomputed unnecessarily

**Example grep:**

```bash
grep -r "groupNavItems" packages/next/src packages/ui/src
grep -r "getNavPrefs" packages/next/src
```

---

## Step 2: Plan the Refactor

Use TodoWrite to create a detailed plan BEFORE making any changes.

### 2.1 Define Goals

What are you trying to achieve? Be specific:

- ❌ Bad: "Clean up the component"
- ✅ Good: "Remove duplicate groupNavItems call in CollectionsTab - it's already computed in DefaultNav"

### 2.2 Create Todo List

```typescript
TodoWrite({
  todos: [
    {
      content: 'Document current data flow (where groups are computed)',
      status: 'in_progress',
      activeForm: 'Documenting current data flow',
    },
    {
      content: 'Identify what CollectionsTab actually needs vs what it receives',
      status: 'pending',
      activeForm: 'Identifying CollectionsTab needs',
    },
    {
      content: 'Remove groupNavItems logic from CollectionsTab.tsx',
      status: 'pending',
      activeForm: 'Removing duplicate groupNavItems',
    },
    {
      content: 'Update CollectionsTab props to receive groups directly',
      status: 'pending',
      activeForm: 'Updating CollectionsTab props',
    },
    {
      content: 'Update SidebarTabs to pass groups correctly',
      status: 'pending',
      activeForm: 'Updating SidebarTabs',
    },
    {
      content: 'Verify no duplicate computations remain',
      status: 'pending',
      activeForm: 'Verifying no duplication',
    },
    {
      content: 'Test in browser',
      status: 'pending',
      activeForm: 'Testing in browser',
    },
  ],
})
```

### 2.3 Identify Risks

What could break?

- Props type mismatches
- Missing data in child components
- Build errors
- Runtime errors
- Performance regressions

---

## Step 3: Execute Changes

Now and ONLY now can you start making changes. Follow your todo list exactly.

### 3.1 Make One Change at a Time

- Complete ONE todo item
- Mark it as "in_progress"
- Make the change
- Mark it as "completed"
- Move to next todo

### 3.2 Update Types First

If changing props:

1. Update the TypeScript interface/type first
2. Then update the implementation
3. Fix any type errors that appear

### 3.3 Add Comments for Complex Changes

Add comments explaining WHY, especially for data flow:

```typescript
// Group collections and globals for nav display
// These groups are passed to SidebarTabs -> CollectionsTab to avoid recomputing
const groups = groupNavItems(...)
```

---

## Step 4: Verify No Duplication

After making changes, explicitly verify:

### 4.1 Search for Duplicate Logic

Use Grep to ensure you didn't leave duplicate code:

```bash
# Search for the function/logic you refactored
grep -r "groupNavItems" packages/next/src packages/ui/src

# Check for duplicate imports
grep -r "import.*groupNavItems" packages/*/src
```

### 4.2 Check Prop Passing

Verify data is passed cleanly:

1. Data computed ONCE at the highest level needed
2. Passed down through props (no re-computation)
3. No unnecessary spreading of props (`{...props}`)

### 4.3 Review Component Hierarchy

Read through the component hierarchy and verify:

- Each component receives exactly what it needs
- No component re-computes data it could receive as props
- No props are passed that aren't used

---

## Step 5: Test and Validate

### 5.1 Build Test

Run builds to catch type errors:

```bash
pnpm turbo build --filter "@payloadcms/ui" --filter "@payloadcms/next"
```

### 5.2 Runtime Test

If there's a dev server:

1. Start/restart the dev server
2. Visually verify the refactored feature works
3. Test edge cases

### 5.3 Mark Final Todo as Complete

Update TodoWrite to mark the final verification step as completed.

---

## Step 6: Document Changes

Add a comment in the refactored code explaining:

1. What was changed
2. Why it was changed (what problem it solved)
3. How data flows now

**Example:**

```typescript
// CollectionsTab now receives pre-computed groups from DefaultNav
// instead of re-computing them. This:
// 1. Eliminates duplicate groupNavItems calls
// 2. Ensures consistent data between Nav and tabs
// 3. Reduces unnecessary re-computation
export type CollectionsTabProps = {
  adminRoute: string
  groups: NavGroupType[] // Pre-computed in DefaultNav
  navPreferences: NavPreferences
}
```

---

## Common Mistakes to Avoid

### ❌ Starting Without Analysis

**Don't:**

- Jump straight into editing code
- Copy/paste from similar components without understanding

**Do:**

- Read and understand current implementation first
- Document the data flow explicitly

### ❌ Skipping TodoWrite

**Don't:**

- Try to hold the refactor plan in your head
- Make changes without a clear sequence

**Do:**

- Create detailed todos before any edits
- Follow them strictly

### ❌ Spreading Props Blindly

**Don't:**

```typescript
<CollectionsTab {...props} />
```

**Do:**

```typescript
<CollectionsTab
  adminRoute={payload.config.routes.admin}
  groups={groups}
  navPreferences={navPreferences}
/>
```

### ❌ Forgetting to Verify

**Don't:**

- Assume duplication is gone
- Skip the verification grep

**Do:**

- Explicitly search for duplicate logic after refactoring
- Run builds to catch type errors

---

## Checklist

Before marking refactoring as complete, verify:

- [ ] Analyzed current implementation and documented data flow
- [ ] Created TodoWrite plan with specific steps
- [ ] Executed changes one todo at a time
- [ ] Verified no duplicate logic remains (via Grep)
- [ ] All builds pass
- [ ] Feature tested in browser (if applicable)
- [ ] Added comments explaining the refactor
- [ ] All todos marked as completed

---

## Example Workflow

**User:** "Refactor CollectionsTab to avoid recomputing groups"

**Assistant (Step 1 - Analysis):**

Let me analyze the current implementation first.

_Reads DefaultNav.tsx, SidebarTabs/index.tsx, CollectionsTab.tsx_

Current data flow:

- `groups` computed in DefaultNav (line 52) via `groupNavItems()`
- Passed to SidebarTabs as prop
- SidebarTabs passes to CollectionsTab
- CollectionsTab ALSO calls `groupNavItems()` again - **DUPLICATION FOUND**

_Uses Grep to verify_

```bash
grep -r "groupNavItems" packages/next/src packages/ui/src
```

Results show 2 calls:

1. DefaultNav.tsx:52
2. CollectionsTab.tsx:28

**Assistant (Step 2 - Planning):**

_Uses TodoWrite to create plan_

Created todos:

1. Remove groupNavItems from CollectionsTab.tsx
2. Update CollectionsTabProps to receive groups
3. Update SidebarTabs to pass groups explicitly
4. Verify no duplication
5. Test build
6. Test in browser

**Assistant (Step 3 - Execute):**

_Marks todo 1 as in_progress_

Removing duplicate groupNavItems logic from CollectionsTab.tsx...

_Makes changes, marks completed, moves to next_

**Assistant (Step 4 - Verify):**

_Runs grep to verify_

```bash
grep -r "groupNavItems" packages/ui/src
```

No matches - duplication eliminated ✓

**Assistant (Step 5 - Test):**

_Runs build_

```bash
pnpm turbo build --filter "@payloadcms/ui"
```

Build successful ✓

_Checks dev server_

CollectionsTab renders correctly with nav groups ✓

**Assistant (Step 6 - Document):**

Added comment to CollectionsTab.tsx explaining groups are pre-computed in DefaultNav.

All todos completed ✓

---

## Integration with Other Skills

This skill works well with:

- **log-pattern**: After refactoring, log the mistake pattern to prevent future occurrences
- **verification-before-completion**: Use before marking refactor complete

---

## When NOT to Use This Skill

Don't use for:

- Simple variable renames (no data flow changes)
- Formatting/style changes
- Adding comments
- One-line fixes

Only use when actually restructuring how code works or how data flows.
