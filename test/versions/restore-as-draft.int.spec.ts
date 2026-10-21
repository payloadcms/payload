import { createPayloadRequest, Forbidden, restoreVersionOperationGlobal } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import { localizedGlobalSlug, restoreAccessGlobalSlug, simpleDraftGlobalSlug } from './slugs.js'

test.suite('Restore global versions as drafts', { config: './config.ts' }, () => {
  test('should restore a never-published global as a draft without creating a live global', async ({
    payload,
    restClient,
  }) => {
    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { title: 'Historical' },
      draft: true,
      overrideAccess: true,
    })

    const { docs } = await payload.findGlobalVersions({
      slug: simpleDraftGlobalSlug,
      limit: 1,
      overrideAccess: true,
      sort: '-updatedAt',
    })

    await payload.updateGlobal({
      slug: simpleDraftGlobalSlug,
      data: { title: 'Current' },
      draft: true,
      overrideAccess: true,
    })

    expect(await payload.db.findGlobal({ slug: simpleDraftGlobalSlug })).toBeFalsy()

    await restClient.login({ slug: 'users', credentials: devUser })

    const response = await restClient.POST(
      `/globals/${simpleDraftGlobalSlug}/versions/${docs[0]!.id}?draft=true`,
    )

    expect(response.status).toBe(200)

    const restoredDraft = await payload.findGlobal({
      slug: simpleDraftGlobalSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(restoredDraft.title).toBe('Historical')
    expect(restoredDraft._status).toBe('draft')
    expect(await payload.db.findGlobal({ slug: simpleDraftGlobalSlug })).toBeFalsy()
  })

  for (const historicalStatus of ['draft', 'published'] as const) {
    test.skip(`should restore a historical ${historicalStatus} global as a draft without changing published content`, async ({
      payload,
      restClient,
    }) => {
      for (const locale of ['en', 'de', 'es'] as const) {
        await payload.updateGlobal({
          slug: localizedGlobalSlug,
          data: {
            _status: historicalStatus,
            content: `Historical content ${locale}`,
            title: `Historical ${locale}`,
          },
          draft: historicalStatus === 'draft',
          locale,
          overrideAccess: true,
        })
      }

      const { docs: historicalVersions } = await payload.findGlobalVersions({
        slug: localizedGlobalSlug,
        limit: 1,
        locale: 'all',
        overrideAccess: true,
        sort: '-updatedAt',
      })
      const historicalVersion = historicalVersions[0]!

      for (const locale of ['en', 'de', 'es'] as const) {
        await payload.updateGlobal({
          slug: localizedGlobalSlug,
          data: {
            _status: 'published',
            content: `Current content ${locale}`,
            title: `Current ${locale}`,
          },
          locale,
          overrideAccess: true,
        })
      }

      await payload.updateGlobal({
        slug: localizedGlobalSlug,
        data: { _status: 'draft' },
        locale: 'es',
        overrideAccess: true,
      })

      const publishedBefore = await payload.db.findGlobal({ slug: localizedGlobalSlug })

      expect(publishedBefore._status).toEqual({ de: 'published', en: 'published', es: 'draft' })

      await restClient.login({ slug: 'users', credentials: devUser })

      const response = await restClient.POST(
        `/globals/${localizedGlobalSlug}/versions/${historicalVersion.id}?draft=true`,
      )

      expect(response.status).toBe(200)

      const { doc: restoredVersion } = await response.json()

      expect(restoredVersion.version._status).toEqual({ de: 'draft', en: 'draft', es: 'draft' })

      const restoredDraft = await payload.findGlobal({
        slug: localizedGlobalSlug,
        draft: true,
        locale: 'all',
        overrideAccess: true,
      })
      const publishedAfter = await payload.db.findGlobal({ slug: localizedGlobalSlug })

      expect(restoredDraft.title).toEqual({
        de: 'Historical de',
        en: 'Historical en',
        es: 'Historical es',
      })
      expect(restoredDraft.content).toEqual({
        de: 'Historical content de',
        en: 'Historical content en',
        es: 'Historical content es',
      })
      expect(restoredDraft._status).toEqual({ de: 'draft', en: 'draft', es: 'draft' })
      expect(publishedAfter).toEqual(publishedBefore)

      const { docs: restoredVersions } = await payload.findGlobalVersions({
        slug: localizedGlobalSlug,
        limit: 1,
        locale: 'all',
        overrideAccess: true,
        sort: '-updatedAt',
      })

      expect(restoredVersions[0]!.id).not.toBe(historicalVersion.id)
      expect(restoredVersions[0]!.version._status).toEqual({
        de: 'draft',
        en: 'draft',
        es: 'draft',
      })
    })
  }

  test('should authorize the draft intent when restoring a published global as a draft', async ({
    payload,
    restClient,
  }) => {
    await payload.updateGlobal({
      slug: restoreAccessGlobalSlug,
      data: { _status: 'published', title: 'Historical' },
      overrideAccess: true,
    })

    const { docs } = await payload.findGlobalVersions({
      slug: restoreAccessGlobalSlug,
      limit: 1,
      overrideAccess: true,
      sort: '-updatedAt',
    })

    await payload.updateGlobal({
      slug: restoreAccessGlobalSlug,
      data: { _status: 'published', title: 'Current' },
      overrideAccess: true,
    })

    const publishedBefore = await payload.db.findGlobal({ slug: restoreAccessGlobalSlug })
    const { user } = await restClient.login({ slug: 'users', credentials: devUser })
    const req = await createPayloadRequest({
      context: { restoreAccessMode: 'publishGate' },
      payload,
      user: { ...user, collection: 'users' },
    })

    await restoreVersionOperationGlobal({
      id: docs[0]!.id,
      draft: true,
      globalConfig: payload.globals.config.find(({ slug }) => slug === restoreAccessGlobalSlug)!,
      overrideAccess: false,
      req,
    })

    const restoredDraft = await payload.findGlobal({
      slug: restoreAccessGlobalSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(restoredDraft.title).toBe('Historical')
    expect(restoredDraft._status).toBe('draft')
    expect(await payload.db.findGlobal({ slug: restoreAccessGlobalSlug })).toEqual(publishedBefore)

    req.context.restoreAccessMode = 'unpublishGate'

    await expect(
      restoreVersionOperationGlobal({
        id: docs[0]!.id,
        draft: true,
        globalConfig: payload.globals.config.find(({ slug }) => slug === restoreAccessGlobalSlug)!,
        overrideAccess: false,
        req,
      }),
    ).rejects.toThrow(Forbidden)
  })

  test('should reject a global draft restore outside the update access constraint', async ({
    payload,
    restClient,
  }) => {
    await payload.updateGlobal({
      slug: restoreAccessGlobalSlug,
      data: { _status: 'published', title: 'Historical' },
      overrideAccess: true,
    })

    const { docs } = await payload.findGlobalVersions({
      slug: restoreAccessGlobalSlug,
      limit: 1,
      overrideAccess: true,
      sort: '-updatedAt',
    })

    await payload.updateGlobal({
      slug: restoreAccessGlobalSlug,
      data: { _status: 'published', title: 'Current' },
      overrideAccess: true,
    })

    const publishedBefore = await payload.db.findGlobal({ slug: restoreAccessGlobalSlug })

    await restClient.login({ slug: 'users', credentials: devUser })

    const response = await restClient.POST(
      `/globals/${restoreAccessGlobalSlug}/versions/${docs[0]!.id}?draft=true`,
    )

    expect(response.status).toBe(403)
    expect(await payload.db.findGlobal({ slug: restoreAccessGlobalSlug })).toEqual(publishedBefore)
  })
})
