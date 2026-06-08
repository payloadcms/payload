import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload } from 'payload'

import path from 'path'
import { createLocalReq } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, expect } from 'vitest'

import { describe, it } from '../../__helpers/int/vitest.js'
import { initPayloadInt } from '../../__helpers/shared/initPayloadInt.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

beforeAll(async () => {
  ;({ payload } = await initPayloadInt(dirname))
})

afterAll(async () => {
  await payload?.destroy()
})

describe('migrateVersionsEnabled (Drizzle SQL)', { db: 'drizzle' }, () => {
  it('should create version entries for existing documents so they are visible as drafts', async () => {
    const req = await createLocalReq({}, payload)

    const rawDoc = await payload.db.create({
      collection: 'posts',
      data: { title: 'Pre-migration post' },
      req,
    })

    // draft:true routes through queryDrafts (versions table); no version entry yet → empty
    const beforeMigration = await payload.find({
      collection: 'posts',
      draft: true,
      where: { id: { equals: rawDoc.id } },
    })
    expect(beforeMigration.docs).toHaveLength(0)

    await payload.db.migrateVersionsEnabled!({
      entity: 'collection',
      initialStatus: 'draft',
      req,
      slug: 'posts',
    })

    const afterMigration = await payload.find({
      collection: 'posts',
      draft: true,
      where: { id: { equals: rawDoc.id } },
    })
    expect(afterMigration.docs).toHaveLength(1)
    expect(afterMigration.docs[0]!.title).toBe('Pre-migration post')
    expect(afterMigration.docs[0]!._status).toBe('draft')

    await payload.delete({ collection: 'posts', id: rawDoc.id })
  })
})

describe('migrateVersionsEnabled (MongoDB)', { db: 'mongo' }, () => {
  it('should create version entries for existing documents so they are visible as drafts', async () => {
    const req = await createLocalReq({}, payload)

    const rawDoc = await payload.db.create({
      collection: 'posts',
      data: { title: 'Pre-migration post' },
      req,
    })

    const beforeMigration = await payload.find({
      collection: 'posts',
      draft: true,
      where: { id: { equals: rawDoc.id } },
    })
    expect(beforeMigration.docs).toHaveLength(0)

    await payload.db.migrateVersionsEnabled!({
      entity: 'collection',
      initialStatus: 'draft',
      req,
      slug: 'posts',
    })

    const afterMigration = await payload.find({
      collection: 'posts',
      draft: true,
      where: { id: { equals: rawDoc.id } },
    })
    expect(afterMigration.docs).toHaveLength(1)
    expect(afterMigration.docs[0]!.title).toBe('Pre-migration post')
    expect(afterMigration.docs[0]!._status).toBe('draft')

    await payload.delete({ collection: 'posts', id: rawDoc.id })
  })
})

describe('migrateFieldLocalized (MongoDB)', { db: 'mongo' }, () => {
  it('should wrap existing flat field values in the default locale object', async () => {
    const req = await createLocalReq({}, payload)

    const adapter = payload.db as MongooseAdapter
    const Model = adapter.collections['articles']
    // Use native driver to bypass Mongoose schema validation — simulating pre-migration flat data
    const result = await Model.collection.insertOne({ title: 'Hello from MongoDB' } as any)
    const docId = result.insertedId
    const inserted = await Model.collection.findOne({ _id: docId })

    expect(typeof inserted!.title).toBe('string')

    await payload.db.migrateFieldLocalized!({
      defaultLocale: 'en',
      entity: 'collection',
      fieldPath: 'title',
      req,
      slug: 'articles',
    })

    const afterLocalize = await Model.collection.findOne({ _id: docId })
    expect((afterLocalize as any).title).toEqual({ en: 'Hello from MongoDB' })

    await Model.collection.deleteOne({ _id: docId })
  })

  it('should unwrap a localized field back to flat when delocalized', async () => {
    const req = await createLocalReq({}, payload)

    const adapter = payload.db as MongooseAdapter
    const Model = adapter.collections['articles']
    const result = await Model.collection.insertOne({
      title: { en: 'Localized value', es: 'Valor localizado' },
    } as any)
    const docId = result.insertedId

    await payload.db.migrateFieldDelocalized!({
      defaultLocale: 'en',
      entity: 'collection',
      fieldPath: 'title',
      req,
      slug: 'articles',
    })

    const afterDelocalize = await Model.collection.findOne({ _id: docId })
    expect((afterDelocalize as any).title).toBe('Localized value')

    await Model.collection.deleteOne({ _id: docId })
  })
})
