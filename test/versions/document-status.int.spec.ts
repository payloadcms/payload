import type { Payload, TypedUser } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLocalReq, updateOperationGlobal } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal admin permission flow.
import { getDocumentPermissions } from '../../packages/next/src/views/Document/getDocumentPermissions.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the internal admin version lookup.
import { getVersions } from '../../packages/next/src/views/Document/getVersions.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
import { cleanupGlobal } from './helpers.js'
import { autoSaveGlobalSlug, simpleDraftGlobalSlug } from './slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

describe('Admin published global status', () => {
  let payload: Payload
  let user: TypedUser

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
    await cleanupGlobal({ globalSlug: autoSaveGlobalSlug, payload })
    await cleanupGlobal({ globalSlug: simpleDraftGlobalSlug, payload })
  })

  afterAll(async () => {
    await payload.delete({ id: user.id, collection: 'users' })
    await payload.destroy()
    delete process.env.SEED_IN_CONFIG_ONINIT
  })

  it('should retain the published global status after autosaving a newer draft and reloading', async () => {
    const globalConfig = payload.config.globals.find(({ slug }) => slug === autoSaveGlobalSlug)!
    const req = await createLocalReq({ user }, payload)

    await payload.updateGlobal({
      slug: autoSaveGlobalSlug,
      data: { _status: 'published', title: 'Published title' },
    })
    await updateOperationGlobal({
      slug: autoSaveGlobalSlug,
      autosave: true,
      data: { title: 'Autosaved title' },
      draft: true,
      globalConfig,
      req,
    })

    const doc = await payload.findGlobal({ slug: autoSaveGlobalSlug, draft: true, user })
    const { docPermissions } = await getDocumentPermissions({ data: doc, globalConfig, req })
    const result = await getVersions({ doc, docPermissions, globalConfig, payload, user })

    expect(doc._status).toBe('draft')
    expect(doc.title).toBe('Autosaved title')
    expect(result.hasPublishedDoc).toBe(true)
    expect(result.unpublishedVersionCount).toBeGreaterThan(0)
    expect(result.mostRecentVersionIsAutosaved).toBe(true)
  })

  it('should not count drafts against a publication timestamp for a never-published global', async () => {
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { _status: 'draft', title: 'First draft' },
      draft: true,
    })
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { title: 'Second draft' },
      draft: true,
    })

    const doc = await payload.findGlobal({ slug: simpleDraftGlobalSlug, draft: true, user })
    const mainDoc = await payload.findGlobal({ slug: simpleDraftGlobalSlug, user })
    const globalConfig = payload.config.globals.find(({ slug }) => slug === simpleDraftGlobalSlug)
    const req = await createLocalReq({ user }, payload)
    const { docPermissions } = await getDocumentPermissions({ data: doc, globalConfig, req })
    const result = await getVersions({ doc, docPermissions, globalConfig, payload, user })

    expect(mainDoc._status).toBe('draft')
    expect(result.hasPublishedDoc).toBe(false)
    expect(result.unpublishedVersionCount).toBe(0)
  })

  it('should not count drafts against a publication timestamp after unpublishing a global', async () => {
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { _status: 'published', title: 'Published title' },
    })
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { _status: 'draft' },
    })
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { title: 'Draft after unpublishing' },
      draft: true,
    })

    const doc = await payload.findGlobal({ slug: simpleDraftGlobalSlug, draft: true, user })
    const mainDoc = await payload.findGlobal({ slug: simpleDraftGlobalSlug, user })
    const globalConfig = payload.config.globals.find(({ slug }) => slug === simpleDraftGlobalSlug)
    const req = await createLocalReq({ user }, payload)
    const { docPermissions } = await getDocumentPermissions({ data: doc, globalConfig, req })
    const result = await getVersions({ doc, docPermissions, globalConfig, payload, user })

    expect(mainDoc._status).toBe('draft')
    expect(result.hasPublishedDoc).toBe(false)
    expect(result.unpublishedVersionCount).toBe(0)
  })
})
