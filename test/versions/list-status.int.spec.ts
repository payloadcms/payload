import type { Payload, TypedUser } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLocalReq } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal admin list enrichment.
import { enrichDocsWithVersionStatus } from '../../packages/next/src/views/List/enrichDocsWithVersionStatus.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { draftsNoReadVersionsSlug } from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Admin list published status', () => {
  let payload: Payload
  let user: TypedUser
  const documentIDs: (number | string)[] = []

  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload } = await initPayloadInt(dirname))

    const createdUser = await payload.create({
      collection: 'users',
      data: { email: 'list-status@payloadcms.com', password: 'test' },
    })

    user = { ...createdUser, collection: 'users' }
  })

  afterEach(async () => {
    vi.restoreAllMocks()

    for (const id of documentIDs) {
      await payload.delete({ id, collection: draftsNoReadVersionsSlug })
    }
    documentIDs.length = 0
  })

  afterAll(async () => {
    await payload.delete({ id: user.id, collection: 'users' })
    await payload.destroy()
    delete process.env.SEED_IN_CONFIG_ONINIT
  })

  it('should show Draft after unpublishing a document with a historical published version', async () => {
    const published = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'published', title: 'Published title' },
    })

    documentIDs.push(published.id)

    await payload.update({
      id: published.id,
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'draft' },
    })

    const req = await createLocalReq({ user }, payload)
    const data = await payload.find({ collection: draftsNoReadVersionsSlug, draft: true, user })
    const mainDoc = await payload.findByID({
      id: published.id,
      collection: draftsNoReadVersionsSlug,
      user,
    })
    const history = await payload.findVersions({
      collection: draftsNoReadVersionsSlug,
      where: {
        and: [{ parent: { equals: published.id } }, { 'version._status': { equals: 'published' } }],
      },
    })
    const result = await enrichDocsWithVersionStatus({
      collectionConfig: payload.collections[draftsNoReadVersionsSlug].config,
      data,
      req,
    })

    expect(mainDoc._status).toBe('draft')
    expect(history.totalDocs).toBeGreaterThan(0)
    expect(result.docs[0]._displayStatus).toBe('draft')
  })

  it('should show Changed for a published document with a newer draft', async () => {
    const published = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'published', title: 'Published title' },
    })

    documentIDs.push(published.id)

    await payload.update({
      id: published.id,
      collection: draftsNoReadVersionsSlug,
      data: { title: 'Draft title' },
      draft: true,
    })

    const req = await createLocalReq({ user }, payload)
    const data = await payload.find({ collection: draftsNoReadVersionsSlug, draft: true, user })
    const result = await enrichDocsWithVersionStatus({
      collectionConfig: payload.collections[draftsNoReadVersionsSlug].config,
      data,
      req,
    })

    expect(data.docs[0]._status).toBe('draft')
    expect(result.docs[0]._displayStatus).toBe('changed')
  })

  it('should leave a never-published document as Draft', async () => {
    const draft = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'draft', title: 'Never published' },
      draft: true,
    })

    documentIDs.push(draft.id)

    const req = await createLocalReq({ user }, payload)
    const data = await payload.find({ collection: draftsNoReadVersionsSlug, draft: true, user })
    const result = await enrichDocsWithVersionStatus({
      collectionConfig: payload.collections[draftsNoReadVersionsSlug].config,
      data,
      req,
    })

    expect(result.docs[0]._displayStatus).toBe('draft')
  })

  it('should honor read access when checking whether a main document is published', async () => {
    const published = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'published', title: 'Published title' },
    })

    documentIDs.push(published.id)

    await payload.update({
      id: published.id,
      collection: draftsNoReadVersionsSlug,
      data: { title: 'Readable draft' },
      draft: true,
    })

    const collectionConfig = payload.collections[draftsNoReadVersionsSlug].config
    const req = await createLocalReq({ user }, payload)

    vi.spyOn(collectionConfig.access, 'read').mockImplementation(() => ({
      _status: { equals: 'draft' },
    }))

    const data = await payload.find({
      collection: draftsNoReadVersionsSlug,
      draft: true,
      overrideAccess: false,
      user,
    })
    const result = await enrichDocsWithVersionStatus({ collectionConfig, data, req })

    expect(data.docs).toHaveLength(1)
    expect(result.docs[0]._displayStatus).toBe('draft')
  })
})
