---
title: Database Adapters & Transactions
description: Database adapters, storage, email, and transaction patterns
tags: [payload, database, mongodb, postgres, sqlite, transactions]
---

# Payload CMS Adapters

## Database Adapters

### MongoDB

```typescript
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
  }),
})
```

### Postgres

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: false, // Don't auto-push schema changes
    migrationDir: './migrations',
  }),
})
```

### SQLite

```typescript
import { sqliteAdapter } from '@payloadcms/db-sqlite'

export default buildConfig({
  db: sqliteAdapter({
    client: {
      url: 'file:./payload.db',
    },
    transactionOptions: {}, // Enable transactions (disabled by default)
  }),
})
```

## Transactions

Payload automatically uses transactions for all-or-nothing database operations.

### Threading req Through Operations

**CRITICAL**: When performing nested operations in hooks, always pass `req` to maintain transaction context.

```typescript
// ✅ CORRECT: Thread req through nested operations
const resaveChildren: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  // Find children - pass req
  const children = await req.payload.find({
    collection: 'children',
    where: { parent: { equals: doc.id } },
    req, // Maintains transaction context
  })

  // Update each child - pass req
  for (const child of children.docs) {
    await req.payload.update({
      id: child.id,
      collection: 'children',
      data: { updatedField: 'value' },
      req, // Same transaction as parent operation
    })
  }
}

// ❌ WRONG: Missing req breaks transaction
const brokenHook: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  const children = await req.payload.find({
    collection: 'children',
    where: { parent: { equals: doc.id } },
    // Missing req - separate transaction or no transaction
  })

  for (const child of children.docs) {
    await req.payload.update({
      id: child.id,
      collection: 'children',
      data: { updatedField: 'value' },
      // Missing req - if parent operation fails, these updates persist
    })
  }
}
```

**Why This Matters:**

- **MongoDB (with replica sets)**: Creates atomic session across operations
- **PostgreSQL**: All operations use same Drizzle transaction
- **SQLite (with transactions enabled)**: Ensures rollback on errors
- **Without req**: Each operation runs independently, breaking atomicity

### Manual Transaction Control

```typescript
const transactionID = await payload.db.beginTransaction()
try {
  await payload.create({
    collection: 'orders',
    data: orderData,
    req: { transactionID },
  })
  await payload.update({
    collection: 'inventory',
    id: itemId,
    data: { stock: newStock },
    req: { transactionID },
  })
  await payload.db.commitTransaction(transactionID)
} catch (error) {
  await payload.db.rollbackTransaction(transactionID)
  throw error
}
```

## Storage Adapters

Available storage adapters:

- **@payloadcms/storage-s3** - AWS S3
- **@payloadcms/storage-azure** - Azure Blob Storage
- **@payloadcms/storage-gcs** - Google Cloud Storage
- **@payloadcms/storage-r2** - Cloudflare R2
- **@payloadcms/storage-vercel-blob** - Vercel Blob
- **@payloadcms/storage-uploadthing** - Uploadthing

### AWS S3

```typescript
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        region: process.env.S3_REGION,
      },
    }),
  ],
})
```

## Email Adapters

### Nodemailer (SMTP)

```typescript
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export default buildConfig({
  email: nodemailerAdapter({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'My App',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
})
```

### Resend

```typescript
import { resendAdapter } from '@payloadcms/email-resend'

export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'My App',
    apiKey: process.env.RESEND_API_KEY,
  }),
})
```

## Important Notes

1. **MongoDB Transactions**: Require replica set configuration
2. **SQLite Transactions**: Disabled by default, enable with `transactionOptions: {}`
3. **Pass req**: Always pass `req` to nested operations in hooks for transaction safety
4. **Point Fields**: Not supported in SQLite
