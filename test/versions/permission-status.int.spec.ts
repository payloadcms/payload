import type { Payload, TypedUser } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLocalReq } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal admin permission flow.
import { getDocumentPermissions } from '../../packages/next/src/views/Document/getDocumentPermissions.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal admin version lookup.
import { getVersions } from '../../packages/next/src/views/Document/getVersions.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { cleanupGlobal } from './helpers.js'
import { draftsNoReadVersionsSlug, simpleDraftGlobalSlug } from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Admin status without readVersions permission', () => {
  let payload: Payload
  let user: TypedUser
  let restoreGlobalAccess = () => {}
  const documentIDs: (number | string)[] = []

  beforeAll(async () => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload } = await initPayloadInt(dirname))

    const createdUser = await payload.create({
      collection: 'users',
      data: { email: 'document-status@payloadcms.com', password: 'test' },
    })

    user = { ...createdUser, collection: 'users' }
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    restoreGlobalAccess()
    await cleanupGlobal({ globalSlug: simpleDraftGlobalSlug, payload })

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

  it('should detect a published collection document beneath a draft without readVersions permission', async () => {
    const published = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'published', title: 'Published title' },
    })

    documentIDs.push(published.id)

    await payload.update({
      id: published.id,
      collection: draftsNoReadVersionsSlug,
      data: { title: 'New draft title' },
      draft: true,
    })

    const doc = await payload.findByID({
      id: published.id,
      collection: draftsNoReadVersionsSlug,
      draft: true,
      user,
    })
    const collectionConfig = payload.collections[draftsNoReadVersionsSlug].config
    const req = await createLocalReq({ user }, payload)
    const { docPermissions } = await getDocumentPermissions({
      id: published.id,
      collectionConfig,
      data: doc,
      req,
    })
    const result = await getVersions({
      id: published.id,
      collectionConfig,
      doc,
      docPermissions,
      payload,
      user,
    })

    expect(docPermissions.readVersions).toBeFalsy()
    expect(doc._status).toBe('draft')
    expect(result.hasPublishedDoc).toBe(true)
    expect(result.versionCount).toBe(0)
    expect(result.unpublishedVersionCount).toBe(1)
  })

  it('should leave a never-published draft false without readVersions permission', async () => {
    const draft = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'draft', title: 'Never published' },
      draft: true,
    })

    documentIDs.push(draft.id)

    const collectionConfig = payload.collections[draftsNoReadVersionsSlug].config
    const req = await createLocalReq({ user }, payload)
    const { docPermissions } = await getDocumentPermissions({
      id: draft.id,
      collectionConfig,
      data: draft,
      req,
    })
    const result = await getVersions({
      id: draft.id,
      collectionConfig,
      doc: draft,
      docPermissions,
      payload,
      user,
    })

    expect(docPermissions.readVersions).toBeFalsy()
    expect(result.hasPublishedDoc).toBe(false)
  })

  it('should not expose a published main document denied by read access', async () => {
    const published = await payload.create({
      collection: draftsNoReadVersionsSlug,
      data: { _status: 'published', title: 'Published title' },
    })

    documentIDs.push(published.id)

    const draft = await payload.update({
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

    const { docPermissions } = await getDocumentPermissions({
      id: published.id,
      collectionConfig,
      data: draft,
      req,
    })
    const result = await getVersions({
      id: published.id,
      collectionConfig,
      doc: draft,
      docPermissions,
      payload,
      user,
    })

    expect(docPermissions.readVersions).toBeFalsy()
    expect(result.hasPublishedDoc).toBe(false)
  })

  it('should detect a published global beneath a draft without readVersions permission', async () => {
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { _status: 'published', title: 'Published title' },
    })
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { title: 'New draft title' },
      draft: true,
    })

    const doc = await payload.findGlobal({ slug: simpleDraftGlobalSlug, draft: true, user })
    const globalConfig = payload.config.globals.find(({ slug }) => slug === simpleDraftGlobalSlug)!
    const req = await createLocalReq({ user }, payload)

    const originalReadVersions = globalConfig.access.readVersions

    restoreGlobalAccess = () => {
      globalConfig.access.readVersions = originalReadVersions
    }
    globalConfig.access.readVersions = () => false

    const { docPermissions } = await getDocumentPermissions({ data: doc, globalConfig, req })
    const result = await getVersions({ doc, docPermissions, globalConfig, payload, user })

    expect(docPermissions.readVersions).toBeFalsy()
    expect(doc._status).toBe('draft')
    expect(result.hasPublishedDoc).toBe(true)
    expect(result.versionCount).toBe(0)
    expect(result.unpublishedVersionCount).toBe(1)
  })
})
