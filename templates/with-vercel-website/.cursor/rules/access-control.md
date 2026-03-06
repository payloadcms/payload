---
title: Access Control
description: Collection, field, and global access control patterns
tags: [payload, access-control, security, permissions, rbac]
---

# Payload CMS Access Control

## Access Control Layers

1. **Collection-Level**: Controls operations on entire documents (create, read, update, delete, admin)
2. **Field-Level**: Controls access to individual fields (create, read, update)
3. **Global-Level**: Controls access to global documents (read, update)

## Collection Access Control

```typescript
import type { Access } from 'payload'

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
  },
}
```

## Common Access Patterns

```typescript
// Anyone
export const anyone: Access = () => true

// Authenticated only
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

// Admin only
export const adminOnly: Access = ({ req: { user } }) => {
  return user?.roles?.includes('admin')
}

// Admin or self
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (user?.roles?.includes('admin')) return true
  return { id: { equals: user?.id } }
}

// Published or authenticated
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

## Row-Level Security

```typescript
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

## Field Access Control

**Field access ONLY returns boolean** (no query constraints).

```typescript
{
  name: 'salary',
  type: 'number',
  access: {
    read: ({ req: { user }, doc }) => {
      // Self can read own salary
      if (user?.id === doc?.id) return true
      // Admin can read all
      return user?.roles?.includes('admin')
    },
    update: ({ req: { user } }) => {
      // Only admins can update
      return user?.roles?.includes('admin')
    },
  },
}
```

## RBAC Pattern

Payload does NOT provide a roles system by default. Add a `roles` field to your auth collection:

```typescript
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: ['admin', 'editor', 'user'],
      defaultValue: ['user'],
      required: true,
      saveToJWT: true, // Include in JWT for fast access checks
      access: {
        update: ({ req: { user } }) => user?.roles?.includes('admin'),
      },
    },
  ],
}
```

## Multi-Tenant Access Control

```typescript
interface User {
  id: string
  tenantId: string
  roles?: string[]
}

const tenantAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.roles?.includes('super-admin')) return true

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
    {
      name: 'tenant',
      type: 'text',
      required: true,
      access: {
        update: ({ req: { user } }) => user?.roles?.includes('super-admin'),
      },
      hooks: {
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

## Important Notes

1. **Local API Default**: Access control is **skipped by default** in Local API (`overrideAccess: true`). When passing a `user` parameter, you must set `overrideAccess: false`:

```typescript
// ❌ WRONG: Passes user but bypasses access control
await payload.find({
  collection: 'posts',
  user: someUser,
})

// ✅ CORRECT: Respects the user's permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // Required to enforce access control
})
```

2. **Field Access Limitations**: Field-level access does NOT support query constraints - only boolean returns.

3. **Admin Panel Visibility**: The `admin` access control determines if a collection appears in the admin panel for a user.
