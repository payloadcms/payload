---
name: add-config-custom-component
description: Use when adding new places in Payload config where users can provide custom components - ensures proper extensibility patterns
allowed-tools: Read, Edit, Write, Glob, Grep, Task, TodoWrite, AskUserQuestion
---

# Add Config Custom Component

Guide implementation of new component slots in Payload config following established extensibility patterns.

## When to Use

- Adding new component slots to Payload config (e.g., new `components` property)
- Exposing places where users/plugins can provide custom components
- Building features that need to be extensible via config

## Process

### Step 1: Understand the Feature

1. Clarify the feature scope and requirements
2. **Use TodoWrite** to create high-level tasks:
   - Understand feature scope and requirements
   - Design component slot structure
   - Implement type definitions
   - Implement config merging
   - Build UI components
   - Add to import map
   - Write tests
   - Update documentation

### Step 2: Read Extensibility Patterns

Read the extensibility patterns documentation:

```bash
Read .claude/artifacts/extensibility-patterns/custom-components/README.md
```

This contains:

- Checklist for adding component slots
- Step-by-step guide
- File locations to edit
- Common patterns

**Mark first todo as completed, move to next**

---

### Step 3: Design Component Slot Structure

Use AskUserQuestion to clarify:

1. **What level is this?**

   - Admin-level (global UI like navigation, header, dashboard)
   - Collection-level (collection-specific UI)
   - Field-level (individual field UI)

2. **What should be extensible?**

   - What parts can users customize?
   - What parts should plugins be able to add?

3. **Slot pattern?**
   - Array slot (multiple items, merge by slug)
   - Single slot (one component replacement)
   - Before/after slots (inject around existing UI)

**Document decisions in artifact or notes file**

**Mark todo as completed, move to next**

---

### Step 4: Implement Type Definitions

Based on the level, edit the appropriate type file:

**Files:**

- Admin-level: `packages/payload/src/config/types.ts`
- Collection-level: `packages/payload/src/collections/config/types.ts`
- Field-level: `packages/payload/src/fields/config/types.ts`

**Pattern to follow:**

```typescript
// Define the slot type
type MyComponentSlot = {
  slug: string // For override/disable
  component: PayloadComponent
  disabled?: boolean
  // ... other properties
}

// Add to config type
type AdminConfig = {
  // ... existing config
  myFeature?: {
    slots?: MyComponentSlot[]
  }
}
```

**Use Edit tool to add type definitions**

**Mark todo as completed, move to next**

---

### Step 5: Implement Config Merging

Create or edit config building logic:

**Pattern:**

```typescript
function buildMySlots(config: Config): MyComponentSlot[] {
  const allSlots = [
    ...getDefaultSlots(), // Built-in defaults
    ...(config.admin?.myFeature?.slots || []),
  ]

  // Merge by slug
  const merged = allSlots.reduce((acc, slot) => {
    const existing = acc.find((s) => s.slug === slot.slug)
    if (existing) {
      Object.assign(existing, slot) // Override
    } else {
      acc.push(slot) // Add new
    }
    return acc
  }, [] as MyComponentSlot[])

  // Filter disabled
  return merged.filter((slot) => !slot.disabled)
}
```

**Ask user:** Should we create default/built-in components now, or focus on structure first?

**Mark todo as completed, move to next**

---

### Step 6: Add to Import Map Generation

Edit: `packages/payload/src/bin/generateImportMap/iterateConfig.ts`

**Add scanning for new component slots:**

```typescript
if (config.admin?.myFeature?.slots) {
  for (const slot of config.admin.myFeature.slots) {
    if (slot.component) {
      addPayloadComponentToImportMap({
        payloadComponent: slot.component,
        importMap,
        imports,
        // ...
      })
    }
  }
}
```

**Use Edit or Grep to find the right location in iterateConfig.ts**

**Mark todo as completed, move to next**

---

### Step 7: Build UI Components

Create UI components that render the slots:

**Use RenderServerComponent pattern:**

```typescript
import { RenderServerComponent } from '@payloadcms/ui'

export const MyFeature: React.FC = () => {
  const slots = useMySlots() // Get registered slots from config

  return (
    <div>
      {slots.map((slot) => (
        <RenderServerComponent
          key={slot.slug}
          Component={slot.component}
          importMap={payload.importMap}
          serverProps={{ payload, user, permissions }}
          clientProps={{ /* client-safe data */ }}
        />
      ))}
    </div>
  )
}
```

**Ask user:** Where should these UI components live? (packages/ui/src/...)

**Mark todo as completed, move to next**

---

### Step 8: Write Tests

Create tests in `test/` directory:

**Test cases:**

```typescript
describe('My Feature', () => {
  it('should include built-in slots by default')
  it('should allow adding custom slots')
  it('should allow disabling built-in slots')
  it('should allow overriding built-in slots by slug')
  it('should merge slots correctly')
})
```

**Ask user:** Should we write tests now or later?

**Mark todo as completed, move to next**

---

### Step 9: Update Documentation

Update extensibility pattern docs:

1. **Level-specific doc** (admin-level.md, collection-level.md, field-level.md)

   - Add new slot to list
   - Document usage
   - Show examples

2. **Create example** (examples/my-feature.md if complex)
   - Design decisions
   - Implementation walkthrough

**Use Edit to update docs**

**Mark todo as completed**

---

## Key Principles

**Always follow:**

1. **Config over code** - Register via config, not imports
2. **Merge by slug** - Allow override/disable
3. **Plugin-friendly** - Plugins can extend without conflicts
4. **Type-safe** - Full TypeScript support
5. **Test extensibility** - Ensure override/disable works
6. **Document** - Update extensibility patterns docs

---

## Reference Files

Read when needed:

- **Practical guide:** `.claude/artifacts/extensibility-patterns/custom-components/README.md`
- **Technical details:** `.claude/artifacts/extensibility-patterns/custom-components/how-it-works.md`
- **Admin-level slots:** `.claude/artifacts/extensibility-patterns/custom-components/admin-level.md`
- **Collection-level slots:** `.claude/artifacts/extensibility-patterns/custom-components/collection-level.md`
- **Field-level slots:** `.claude/artifacts/extensibility-patterns/custom-components/field-level.md`

---

## Example Invocation

```
User: "I want to make the sidebar tabs extensible so users can add custom tabs via config."
```

**You would:**

1. Read extensibility patterns
2. Ask: "This looks like admin-level (global sidebar). Should tabs be an array slot where plugins can add custom tabs?"
3. Design: Array slot with merge-by-slug pattern
4. Implement: Type definitions → Config merging → UI → Import map → Tests → Docs
5. Reference sidebar-tabs.md example throughout

---

## Important Notes

- **Always read the extensibility patterns docs first** - Don't guess
- **Use TodoWrite** to track progress through the checklist
- **Ask questions** when design decisions aren't clear
- **Reference existing patterns** - Look at how similar features work
- **Test extensibility** - Users should be able to override/disable/extend
- **Update docs** - Keep extensibility patterns up to date

---

## Success Criteria

Feature is complete when:

- [ ] Users can add custom slots via config
- [ ] Users can override built-in slots by slug
- [ ] Users can disable built-in slots
- [ ] Plugins can extend without conflicts
- [ ] TypeScript types are complete
- [ ] Tests cover extensibility
- [ ] Documentation is updated
- [ ] RenderServerComponent is used correctly
- [ ] Components are in import map
