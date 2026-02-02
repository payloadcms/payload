---
title: Payload CMS Overview
description: Core principles and quick reference for Payload CMS development
tags: [payload, overview, quickstart]
---

# Payload CMS Development Rules

You are an expert Payload CMS developer. When working with Payload projects, follow these rules:

## Core Principles

1. **TypeScript-First**: Always use TypeScript with proper types from Payload
2. **Security-Critical**: Follow all security patterns, especially access control
3. **Type Generation**: Run `generate:types` script after schema changes
4. **Transaction Safety**: Always pass `req` to nested operations in hooks
5. **Access Control**: Understand Local API bypasses access control by default

## Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Frontend routes
│   └── (payload)/           # Payload admin routes
├── collections/             # Collection configs
├── globals/                 # Global configs
├── components/              # Custom React components
├── hooks/                   # Hook functions
├── access/                  # Access control functions
└── payload.config.ts        # Main config
```

## Minimal Config Pattern

```typescript
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: 'users',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
  }),
})
```

## Getting Payload Instance

```typescript
// In API routes (Next.js)
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config })

  const posts = await payload.find({
    collection: 'posts',
  })

  return Response.json(posts)
}

// In Server Components
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function Page() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'posts' })

  return <div>{docs.map(post => <h1 key={post.id}>{post.title}</h1>)}</div>
}
```

## Quick Reference

| Task                  | Solution                           |
| --------------------- | ---------------------------------- |
| Auto-generate slugs   | `slugField()`                      |
| Restrict by user      | Access control with query          |
| Local API user ops    | `user` + `overrideAccess: false`   |
| Draft/publish         | `versions: { drafts: true }`       |
| Computed fields       | `virtual: true` with afterRead     |
| Conditional fields    | `admin.condition`                  |
| Custom validation     | `validate` function                |
| Filter relationships  | `filterOptions` on field           |
| Select fields         | `select` parameter                 |
| Auto-set dates        | beforeChange hook                  |
| Prevent loops         | `req.context` check                |
| Cascading deletes     | beforeDelete hook                  |
| Geospatial queries    | `point` field with `near`/`within` |
| Reverse relationships | `join` field type                  |
| Query relationships   | Nested property syntax             |
| Complex queries       | AND/OR logic                       |
| Transactions          | Pass `req` to operations           |
| Background jobs       | Jobs queue with tasks              |
| Custom routes         | Collection custom endpoints        |
| Cloud storage         | Storage adapter plugins            |
| Multi-language        | `localization` + `localized: true` |

## Resources

- Docs: https://payloadcms.com/docs
- LLM Context: https://payloadcms.com/llms-full.txt
- GitHub: https://github.com/payloadcms/payload
- Examples: https://github.com/payloadcms/payload/tree/main/examples
- Templates: https://github.com/payloadcms/payload/tree/main/templates
