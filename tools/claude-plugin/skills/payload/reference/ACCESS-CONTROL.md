# Payload CMS Access Control Reference

Complete reference for access control patterns across collections, fields, and globals.

## At a Glance

| Feature               | Scope                                                     | Returns                | Use Case                           |
| --------------------- | --------------------------------------------------------- | ---------------------- | ---------------------------------- |
| **Collection Access** | create, read, update, delete, admin, unlock, readVersions | boolean \| Where query | Document-level permissions         |
| **Field Access**      | create, read, update                                      | boolean only           | Field-level visibility/editability |
| **Global Access**     | read, update, readVersions                                | boolean \| Where query | Global document permissions        |

## Three Layers of Access Control

Payload provides three distinct access control layers:

1. **Collection-Level**: Controls operations on entire documents (create, read, update, delete, admin, unlock, readVersions)
2. **Field-Level**: Controls access to individual fields (create, read, update)
3. **Global-Level**: Controls access to global documents (read, update, readVersions)

## Return Value Types

Access control functions can return:

- **Boolean**: `true` (allow) or `false` (deny)
- **Query Constraint**: `Where` object for row-level security (collection-level only)

Field-level access does NOT support query constraints - only boolean returns.

## Operation Decision Tree

```txt
User makes request
    │
    ├─ Collection access check
    │   ├─ Returns false? → Deny entire operation
    │   ├─ Returns true? → Continue
    │   └─ Returns Where? → Apply query constraint
    │
    ├─ Field access check (if applicable)
    │   ├─ Returns false? → Field omitted from result
    │   └─ Returns true? → Include field
    │
    └─ Operation completed
```

## Collection Access Control

### Basic Patterns

```ts
import type { CollectionConfig, Access } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    // Boolean: Only authenticated users can create
    create: ({ req: { user } }) => Boolean(user),

    // Query constraint: Public sees published, users see all
    read: ({ req: { user } }) => {
      if (user) return true
      return { status: { equals: 'published' } }
    },

    // User-specific: Admins or document owner
    update: ({ req: { user }, id }) => {
      if (user?.roles?.includes('admin')) return true
      return { author: { equals: user?.id } }
    },

    // Async: Check related data
    delete: async ({ req, id }) => {
      const hasComments = await req.payload.count({
        collection: 'comments',
        where: { post: { equals: id } },
      })
      return hasComments === 0
    },

    // Admin panel visibility
    admin: ({ req: { user } }) => {
      return user?.roles?.includes('admin') || user?.roles?.includes('editor')
    },
  },
  fields: [
    { name: 'title', type: 'text' },
    { name: 'status', type: 'select', options: ['draft', 'published'] },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
}
```

### Role-Based Access Control (RBAC) Pattern

Payload does NOT provide a roles system by default. The following is a commonly accepted pattern for implementing role-based access control in auth collections:

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      defaultValue: ['user'],
      required: true,
      // Save roles to JWT for access control without database lookups
      saveToJWT: true,
      access: {
        // Only admins can update roles
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      },
    },
  ],
}
```

**Important Notes:**

1. **Not Built-In**: Payload does not provide a roles system out of the box. You must add a `roles` field to your auth collection.
2. **Save to JWT**: Use `saveToJWT: true` to include roles in the JWT token, enabling role checks without database queries.
3. **Default Value**: Set a `defaultValue` to automatically assign new users a default role.
4. **Access Control**: Restrict who can modify roles (typically only admins).
5. **Role Options**: Define your own role hierarchy based on your application needs.

**Using Roles in Access Control:**

```ts
import type { Access } from 'payload'

// Check for specific role
export const adminOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin')
}

// Check for multiple roles
export const adminOrEditor: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.some((role) => ['admin', 'editor'].includes(role)))
}

// Role hierarchy check
export const hasMinimumRole: Access = ({ req: { user } }, minRole: string) => {
  const roleHierarchy = ['user', 'editor', 'admin']
  const userHighestRole = Math.max(...(user?.roles?.map((r) => roleHierarchy.indexOf(r)) || [-1]))
  const requiredRoleIndex = roleHierarchy.indexOf(minRole)

  return userHighestRole >= requiredRoleIndex
}
```

### Reusable Access Functions

```ts
import type { Access } from 'payload'

// Anyone (public)
export const anyone: Access = () => true

// Authenticated only
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Authenticated or published content
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

// Admin only
export const admins: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin')
}

// Admin or editor
export const adminsOrEditors: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.some((role) => ['admin', 'editor'].includes(role)))
}

// Self or admin
export const adminsOrSelf: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return { id: { equals: user?.id } }
}

// Usage
export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: adminsOrEditors,
    delete: admins,
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

### Row-Level Security with Complex Queries

```ts
import type { Access } from 'payload'

// Organization-scoped access
export const organizationScoped: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true

  // Users see only their organization's data
  return {
    organization: {
      equals: user?.organization,
    },
  }
}

// Multiple conditions with AND
export const complexAccess: Access = ({ req: { user } }) => {
  return {
    and: [
      { status: { equals: 'published' } },
      { 'author.isActive': { equals: true } },
      {
        or: [{ visibility: { equals: 'public' } }, { author: { equals: user?.id } }],
      },
    ],
  }
}

// Team-based access
export const teamMemberAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('admin')) return true

  return {
    'team.members': {
      contains: user.id,
    },
  }
}
```

### Header-Based Access (API Keys)

```ts
import type { Access } from 'payload'

export const apiKeyAccess: Access = ({ req }) => {
  const apiKey = req.headers.get('x-api-key')

  if (!apiKey) return false

  // Validate against stored keys
  return apiKey === process.env.VALID_API_KEY
}

// Bearer token validation
export const bearerTokenAccess: Access = async ({ req }) => {
  const auth = req.headers.get('authorization')

  if (!auth?.startsWith('Bearer ')) return false

  const token = auth.slice(7)
  const isValid = await validateToken(token)

  return isValid
}
```

## Field Access Control

Field access does NOT support query constraints - only boolean returns.

### Basic Field Access

```ts
import type { NumberField, FieldAccess } from 'payload'

const salaryReadAccess: FieldAccess = ({ req: { user }, doc }) => {
  // Self can read own salary
  if (user?.id === doc?.id) return true
  // Admin can read all salaries
  return user?.roles?.includes('admin')
}

const salaryUpdateAccess: FieldAccess = ({ req: { user } }) => {
  // Only admins can update salary
  return user?.roles?.includes('admin')
}

const salaryField: NumberField = {
  name: 'salary',
  type: 'number',
  access: {
    read: salaryReadAccess,
    update: salaryUpdateAccess,
  },
}
```

### Sibling Data Access

```ts
import type { ArrayField, FieldAccess } from 'payload'

const contentReadAccess: FieldAccess = ({ req: { user }, siblingData }) => {
  // Authenticated users see all
  if (user) return true
  // Public sees only if marked public
  return siblingData?.isPublic === true
}

const arrayField: ArrayField = {
  name: 'sections',
  type: 'array',
  fields: [
    {
      name: 'isPublic',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'content',
      type: 'text',
      access: {
        read: contentReadAccess,
      },
    },
  ],
}
```

### Nested Field Access

```ts
import type { GroupField, FieldAccess } from 'payload'

const internalOnlyAccess: FieldAccess = ({ req: { user } }) => {
  return user?.roles?.includes('admin') || user?.roles?.includes('internal')
}

const groupField: GroupField = {
  name: 'internalMetadata',
  type: 'group',
  access: {
    read: internalOnlyAccess,
    update: internalOnlyAccess,
  },
  fields: [
    { name: 'internalNotes', type: 'textarea' },
    { name: 'priority', type: 'select', options: ['low', 'medium', 'high'] },
  ],
}
```

### Hiding Admin Fields

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      access: {
        // Hide from UI, but still saved/queried
        read: ({ req: { user } }) => user?.roles?.includes('admin'),
        // Only admins can update roles
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      },
    },
  ],
}
```

## Global Access Control

```ts
import type { GlobalConfig, Access } from 'payload'

const adminOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin')
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  access: {
    read: () => true, // Anyone can read settings
    update: adminOnly, // Only admins can update
    readVersions: adminOnly, // Only admins can see version history
  },
  fields: [
    { name: 'siteName', type: 'text' },
    { name: 'maintenanceMode', type: 'checkbox' },
  ],
}
```

## Multi-Tenant Access Control

```ts
import type { Access, CollectionConfig } from 'payload'

// Add tenant field to user type
interface User {
  id: string
  tenantId: string
  roles?: string[]
}

// Tenant-scoped access
const tenantAccess: Access = ({ req: { user } }) => {
  // No user = no access
  if (!user) return false

  // Super admin sees all
  if (user.roles?.includes('super-admin')) return true

  // Users see only their tenant's data
  return {
    tenant: {
      equals: (user as User).tenantId,
    },
  }
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: tenantAccess,
    read: tenantAccess,
    update: tenantAccess,
    delete: tenantAccess,
  },
  fields: [
    { name: 'title', type: 'text' },
    {
      name: 'tenant',
      type: 'text',
      required: true,
      access: {
        // Tenant field hidden from non-admins
        update: ({ req: { user } }) => user?.roles?.includes('super-admin'),
      },
      hooks: {
        // Auto-set tenant on create
        beforeChange: [
          ({ req, operation, value }) => {
            if (operation === 'create' && !value) {
              return (req.user as User)?.tenantId
            }
            return value
          },
        ],
      },
    },
  ],
}
```

## Auth Collection Patterns

### Self or Admin Pattern

```ts
import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    // Anyone can read user profiles
    read: () => true,

    // Users can update themselves, admins can update anyone
    update: ({ req: { user }, id }) => {
      if (user?.roles?.includes('admin')) return true
      return user?.id === id
    },

    // Only admins can delete
    delete: ({ req: { user } }) => user?.roles?.includes('admin'),
  },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email' },
  ],
}
```

### Restrict Self-Updates

```ts
import type { CollectionConfig, FieldAccess } from 'payload'

const preventSelfRoleChange: FieldAccess = ({ req: { user }, id }) => {
  // Admins can change anyone's roles
  if (user?.roles?.includes('admin')) return true
  // Users cannot change their own roles
  if (user?.id === id) return false
  return false
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      access: {
        update: preventSelfRoleChange,
      },
    },
  ],
}
```

## Cross-Collection Validation

```ts
import type { Access } from 'payload'

// Check if user is a project member before allowing access
export const projectMemberAccess: Access = async ({ req, id }) => {
  const { user, payload } = req

  if (!user) return false
  if (user.roles?.includes('admin')) return true

  // Check if document exists and user is member
  const project = await payload.findByID({
    collection: 'projects',
    id: id as string,
    depth: 0,
  })

  return project.members?.includes(user.id)
}

// Prevent deletion if document has dependencies
export const preventDeleteWithDependencies: Access = async ({ req, id }) => {
  const { payload } = req

  const dependencyCount = await payload.count({
    collection: 'related-items',
    where: {
      parent: { equals: id },
    },
  })

  return dependencyCount === 0
}
```

## Access Control Function Arguments

### Collection Create

```ts
create: ({ req, data }) => boolean | Where

// req: PayloadRequest
//   - req.user: Authenticated user (if any)
//   - req.payload: Payload instance for queries
//   - req.headers: Request headers
//   - req.locale: Current locale
// data: The data being created
```

### Collection Read

```ts
read: ({ req, id }) => boolean | Where

// req: PayloadRequest
// id: Document ID being read
//   - undefined during Access Operation (login check)
//   - string when reading specific document
```

### Collection Update

```ts
update: ({ req, id, data }) => boolean | Where

// req: PayloadRequest
// id: Document ID being updated
// data: New values being applied
```

### Collection Delete

```ts
delete: ({ req, id }) => boolean | Where

// req: PayloadRequest
// id: Document ID being deleted
```

### Field Create

```ts
access: {
  create: ({ req, data, siblingData }) => boolean
}

// req: PayloadRequest
// data: Full document data
// siblingData: Adjacent field values at same level
```

### Field Read

```ts
access: {
  read: ({ req, id, doc, siblingData }) => boolean
}

// req: PayloadRequest
// id: Document ID
// doc: Full document
// siblingData: Adjacent field values
```

### Field Update

```ts
access: {
  update: ({ req, id, data, doc, siblingData }) => boolean
}

// req: PayloadRequest
// id: Document ID
// data: New values
// doc: Current document
// siblingData: Adjacent field values
```

## Important Notes

1. **Local API Default**: Access control is **skipped by default** in Local API (`overrideAccess: true`). When passing a `user` parameter, you almost always want to set `overrideAccess: false` to respect that user's permissions:

   ```ts
   // ❌ WRONG: Passes user but bypasses access control (default behavior)
   await payload.find({
     collection: 'posts',
     user: someUser, // User is ignored for access control!
   })

   // ✅ CORRECT: Respects the user's permissions
   await payload.find({
     collection: 'posts',
     user: someUser,
     overrideAccess: false, // Required to enforce access control
   })
   ```

   **Why this matters**: If you pass `user` without `overrideAccess: false`, the operation runs with admin privileges regardless of the user's actual permissions. This is a common security mistake.

2. **Field Access Limitations**: Field-level access does NOT support query constraints - only boolean returns.

3. **Admin Panel Visibility**: The `admin` access control determines if a collection appears in the admin panel for a user.

4. **Access Before Hooks**: Access control executes BEFORE hooks run, so hooks cannot modify access behavior.

5. **Query Constraints**: Only collection-level `read` access supports query constraints. All other operations and field-level access require boolean returns.

## Best Practices

1. **Reusable Functions**: Create named access functions for common patterns
2. **Fail Secure**: Default to `false` for sensitive operations
3. **Cache Checks**: Use `req.context` to cache expensive validation
4. **Type Safety**: Type your user object for better IDE support
5. **Test Thoroughly**: Write tests for complex access control logic
6. **Document Intent**: Add comments explaining access rules
7. **Audit Logs**: Track access control decisions for security review
8. **Performance**: Avoid N+1 queries in access functions
9. **Error Handling**: Access functions should not throw - return `false` instead
10. **Tenant Hooks**: Auto-set tenant fields in `beforeChange` hooks

## Advanced Patterns

For advanced access control patterns including context-aware access, time-based restrictions, subscription-based access, factory functions, configuration templates, debugging tips, and performance optimization, see [ACCESS-CONTROL-ADVANCED.md](ACCESS-CONTROL-ADVANCED.md).
