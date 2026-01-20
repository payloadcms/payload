# Monorepo Patterns

Patterns for working in a monorepo with multiple packages.

---

## Pattern: Cross-package imports

❌ **Bad:**

```typescript
// In packages/next/src/elements/Nav/SidebarTabs/index.tsx
import { CollectionsTab } from '../../../../../ui/src/elements/Sidebar/tabs/CollectionsTab.js'
```

✅ **Good:**

```typescript
// In packages/ui/src/exports/rsc/index.ts
export { CollectionsTab } from '../../elements/Sidebar/tabs/index.js'

// In packages/next/src/elements/Nav/SidebarTabs/index.tsx
import { CollectionsTab } from '@payloadcms/ui/rsc'
```

💡 **Why:** Never use relative paths to import from one package to another in a monorepo. Always:

1. Export the component/function from the source package's public API (e.g., `exports/rsc/index.ts`)
2. Import using the package name (e.g., `@payloadcms/ui/rsc`)

This ensures proper build order, type checking, and prevents circular dependencies. Relative imports bypass the package boundary and break the build system.

---

## Pattern: Import shared types from payload package

❌ **Bad:**

```typescript
// In packages/ui package
import { EntityType } from '../../../utilities/groupNavItems.js'
```

✅ **Good:**

```typescript
// In packages/ui package
import { EntityType } from 'payload'

// Exception: If you are inside packages/payload folder, use relative imports
import { EntityType } from '../utilities/groupNavItems.js'
```

💡 **Why:** Prefer to import shared types from the `payload` package instead of duplicating them in another package. This ensures a single source of truth and proper type consistency. Only use relative imports when you are already inside the `packages/payload` folder.

---
