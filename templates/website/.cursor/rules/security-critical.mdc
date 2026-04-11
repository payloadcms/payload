---
title: Critical Security Patterns
description: The three most important security patterns in Payload CMS
tags: [payload, security, critical, access-control, transactions, hooks]
priority: high
---

# CRITICAL SECURITY PATTERNS

These are the three most critical security patterns that MUST be followed in every Payload CMS project.

## 1. Local API Access Control (MOST IMPORTANT)

**By default, Local API operations bypass ALL access control**, even when passing a user.

```typescript
// ❌ SECURITY BUG: Passes user but ignores their permissions
await payload.find({
  collection: 'posts',
  user: someUser, // Access control is BYPASSED!
})

// ✅ SECURE: Actually enforces the user's permissions
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false, // REQUIRED for access control
})

// ✅ Administrative operation (intentional bypass)
await payload.find({
  collection: 'posts',
  // No user, overrideAccess defaults to true
})
```

**When to use each:**

- `overrideAccess: true` (default) - Server-side operations you trust (cron jobs, system tasks)
- `overrideAccess: false` - When operating on behalf of a user (API routes, webhooks)

**Rule**: When passing `user` to Local API, ALWAYS set `overrideAccess: false`

## 2. Transaction Safety in Hooks

**Nested operations in hooks without `req` break transaction atomicity.**

```typescript
// ❌ DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ]
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        data: { docId: doc.id },
        req, // Maintains atomicity
      })
    },
  ]
}
```

**Why This Matters:**

- **MongoDB (with replica sets)**: Creates atomic session across operations
- **PostgreSQL**: All operations use same Drizzle transaction
- **SQLite (with transactions enabled)**: Ensures rollback on errors
- **Without req**: Each operation runs independently, breaking atomicity

**Rule**: ALWAYS pass `req` to nested operations in hooks

## 3. Prevent Infinite Hook Loops

**Hooks triggering operations that trigger the same hooks create infinite loops.**

```typescript
// ❌ INFINITE LOOP
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
      }) // Triggers afterChange again!
    },
  ]
}

// ✅ SAFE: Use context flag
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ]
}
```

**Rule**: Use `req.context` flags to prevent hook loops
