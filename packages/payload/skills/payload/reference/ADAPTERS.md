# Payload Adapters Reference

Complete reference for database, storage, and email adapters.

## Database Adapters

### MongoDB

```ts
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
  }),
})
```

### Postgres

```ts
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

Keep the default `transactionOptions: false` by omitting the option. SQLite transactions are not fully supported or recommended in Payload: enabling them can cause locking issues. Do not add `transactionOptions: {}` to generated configs or as a fix for nested hook operations.

```ts
import { sqliteAdapter } from '@payloadcms/db-sqlite'

export default buildConfig({
  db: sqliteAdapter({
    client: {
      url: 'file:./payload.db',
    },
  }),
})
```

## Transactions

MongoDB (with a replica set) and Postgres use transactions by default unless disabled with `transactionOptions: false`. When a Payload operation starts a transaction, its database changes are committed on success or rolled back on failure. Nested operations share that transaction when you pass `req`.

SQLite leaves transactions disabled by default. With transactions disabled, passing `req` still preserves request context, but does not provide atomicity or rollback across operations. If a later operation fails, earlier writes can persist. Do not enable SQLite transactions to satisfy general transaction guidance.

```ts
import type { CollectionAfterChangeHook } from 'payload'

const afterChange: CollectionAfterChangeHook = async ({ req, doc }) => {
  // Share the parent operation's transaction, if active
  await req.payload.create({
    req, // Preserves request context even when transactions are disabled
    collection: 'audit-log',
    overrideAccess: true,
    data: { action: 'created', docId: doc.id },
  })
}

// Manual transaction control requires an adapter with transactions enabled
const transactionID = await payload.db.beginTransaction()

if (transactionID == null) {
  throw new Error('This operation requires a database adapter with transactions enabled')
}

try {
  await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: orderData,
    req: { transactionID },
  })
  await payload.update({
    collection: 'inventory',
    overrideAccess: true,
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

### Threading req Through Operations

**Critical**: When performing nested operations in hooks, always pass `req` to preserve request context. When transactions are enabled, this also maintains transaction context; failing to do so breaks atomicity and can cause partial updates.

```ts
import type { CollectionAfterChangeHook } from 'payload'

// ✅ CORRECT: Thread req through nested operations
const resaveChildren: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  // Find children - pass req
  const children = await req.payload.find({
    collection: 'children',
    overrideAccess: true,
    where: { parent: { equals: doc.id } },
    req, // Shares the active transaction, if any
  })

  // Update each child - pass req
  for (const child of children.docs) {
    await req.payload.update({
      id: child.id,
      collection: 'children',
      overrideAccess: true,
      data: { updatedField: 'value' },
      req, // Shares the active transaction, if any
    })
  }
}

// ❌ WRONG: Missing req loses request context and any active transaction
const brokenHook: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  const children = await req.payload.find({
    collection: 'children',
    overrideAccess: true,
    where: { parent: { equals: doc.id } },
    // Missing req - separate transaction or no transaction
  })

  for (const child of children.docs) {
    await req.payload.update({
      id: child.id,
      collection: 'children',
      overrideAccess: true,
      data: { updatedField: 'value' },
      // Missing req - if parent operation fails, these updates persist
    })
  }
}
```

**Why This Matters:**

- **With an active transaction**: Passing `req` keeps nested operations in the parent operation's transaction. Omitting it can allow nested writes to persist if the parent operation fails.
- **With transactions disabled**: Passing `req` does not create a transaction or provide rollback across operations. This is the default for SQLite.
- **Request context**: Passing `req` also preserves `req.user`, `req.context`, and the current locale, regardless of transaction support.

Pass `req` to nested reads and writes in hooks. Read-only operations can also need the active transaction to see uncommitted writes. Neither `disableTransaction: true` nor `overrideAccess: true` replaces the need to preserve request context.

## Storage Adapters

Available storage adapters:

- **@payloadcms/storage-s3** - AWS S3
- **@payloadcms/storage-azure** - Azure Blob Storage
- **@payloadcms/storage-gcs** - Google Cloud Storage
- **@payloadcms/storage-r2** - Cloudflare R2
- **@payloadcms/storage-vercel-blob** - Vercel Blob

### AWS S3

```ts
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

### Azure Blob Storage

```ts
import { azureStorage } from '@payloadcms/storage-azure'

export default buildConfig({
  plugins: [
    azureStorage({
      collections: {
        media: true,
      },
      connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
      containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
    }),
  ],
})
```

### Google Cloud Storage

```ts
import { gcsStorage } from '@payloadcms/storage-gcs'

export default buildConfig({
  plugins: [
    gcsStorage({
      collections: {
        media: true,
      },
      bucket: process.env.GCS_BUCKET,
      options: {
        projectId: process.env.GCS_PROJECT_ID,
        credentials: JSON.parse(process.env.GCS_CREDENTIALS),
      },
    }),
  ],
})
```

### Cloudflare R2

```ts
import { r2Storage } from '@payloadcms/storage-r2'

export default buildConfig({
  plugins: [
    r2Storage({
      collections: {
        media: true,
      },
      bucket: process.env.R2_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
      },
    }),
  ],
})
```

### Vercel Blob

```ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
```

## Email Adapters

### Nodemailer (SMTP)

```ts
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

```ts
import { resendAdapter } from '@payloadcms/email-resend'

export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'My App',
    apiKey: process.env.RESEND_API_KEY,
  }),
})
```
