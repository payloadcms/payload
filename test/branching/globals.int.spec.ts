import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import {
  branchChangesSlug,
  branchesSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  uninitializedGlobalSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: globals', { config: './config.ts', resetBetweenTests: false }, () => {
  test.beforeAll(async ({ payloadInstance, restClientInstance }) => {
    payload = createTrustedPayload(payloadInstance)
    restClient = restClientInstance

    const login = await restClient
      .POST('/users/login', {
        body: JSON.stringify({ email: devUser.email, password: devUser.password }),
      })
      .then((res) => res.json())

    token = login.token
  })

  test.describe('Globals', () => {
    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'globalwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Global work', slug: 'globalwork' },
        })
      }

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main nav' },
      })
    })

    test.options(
      'should uniquely store two globals on main and the same branch in MongoDB',
      { db: 'mongo' },
      async () => {
        const branch = 'mongo-global-index'
        const adapter = payload.db as MongooseAdapter
        const branchDoc = await payload.create({
          collection: branchesSlug,
          data: { name: 'Mongo global index', slug: branch },
        })

        try {
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            data: { navLabel: 'main nav' },
          })
          await payload.updateGlobal({
            slug: uninitializedGlobalSlug,
            data: { branchValue: 'secondary on main' },
          })
          await payload.updateGlobal({
            slug: headerGlobalSlug,
            branch,
            data: { navLabel: 'header on branch' },
          })
          await payload.updateGlobal({
            slug: uninitializedGlobalSlug,
            branch,
            data: { branchValue: 'secondary on branch' },
          })

          const rows = await adapter.globals
            .find({
              _branch: { $in: [branch, 'main'] },
              globalType: { $in: [headerGlobalSlug, uninitializedGlobalSlug] },
            })
            .lean()
          const indexes = await adapter.globals.collection.indexes()
          const configuredBranchField = payload.globals.config
            .find(({ slug }) => slug === headerGlobalSlug)
            ?.flattenedFields.find(({ name }) => name === '_branch')
          const globalBranchIndex = indexes.find(
            ({ key }: { key: Record<string, number> }) =>
              key.globalType === 1 && key._branch === 1 && Object.keys(key).length === 2,
          )
          const branchOnlyIndex = indexes.find(
            ({ key }: { key: Record<string, number> }) =>
              key._branch === 1 && Object.keys(key).length === 1,
          )

          expect(rows).toHaveLength(4)
          expect(configuredBranchField).toMatchObject({ index: true, unique: true })
          expect(globalBranchIndex).toMatchObject({ unique: true })
          expect(branchOnlyIndex).toBeUndefined()
          await expect(
            adapter.globals.collection.insertOne({
              _branch: branch,
              globalType: headerGlobalSlug,
              navLabel: 'duplicate branch row',
            }),
          ).rejects.toMatchObject({ code: 11000 })
        } finally {
          await adapter.globals.deleteMany({ globalType: uninitializedGlobalSlug })
          await adapter.globals.deleteOne({
            _branch: branch,
            globalType: headerGlobalSlug,
          })

          const changes = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: branch } },
          })

          for (const change of changes.docs) {
            await payload.delete({ id: change.id, collection: branchChangesSlug })
          }

          await payload.delete({ id: branchDoc.id, collection: branchesSlug })
        }
      },
    )

    test('should leave main untouched when editing a global on a branch', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
        data: { navLabel: 'branch nav' },
      })

      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onMain.navLabel).toBe('main nav')
    })

    test('should return the branch version when reading the global on that branch', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
        data: { navLabel: 'branch nav' },
      })

      const onBranch = await payload.findGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
      })

      expect(onBranch.navLabel).toBe('branch nav')
    })

    test('should read through to main for a global never edited on the branch', async () => {
      const onOtherBranch = await payload.findGlobal({
        slug: headerGlobalSlug,
        branch: 'halloween',
      })

      expect(onOtherBranch.navLabel).toBe('main nav')
    })

    test('should keep two branches independent for the same global', async () => {
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'globalwork',
        data: { navLabel: 'globalwork nav' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: 'q4',
        data: { navLabel: 'q4 nav' },
      })

      const a = await payload.findGlobal({ slug: headerGlobalSlug, branch: 'globalwork' })
      const b = await payload.findGlobal({ slug: headerGlobalSlug, branch: 'q4' })
      const main = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(a.navLabel).toBe('globalwork nav')
      expect(b.navLabel).toBe('q4 nav')
      expect(main.navLabel).toBe('main nav')
    })

    /**
     * The corruption case. Global versions have no `parent` to scope `latest`
     * by, and the clearing statement in `createGlobalVersion` is unscoped — so
     * without a branch-scoped fix, saving a draft of a global on a branch
     * silently clears main's latest flag and main loses its draft.
     */
    test('should not clear main latest version flag when saving a global draft on a branch', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', heroTitle: 'published on main' },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { heroTitle: 'main draft' },
        draft: true,
      })

      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch: 'globalwork',
        data: { heroTitle: 'branch draft' },
        draft: true,
      })

      const mainLatest = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        pagination: false,
        where: { and: [{ latest: { equals: true } }, { _branch: { equals: 'main' } }] },
      })

      expect(mainLatest.docs).toHaveLength(1)
      expect(mainLatest.docs[0]!.version.heroTitle).toBe('main draft')
    })

    test('should hide a global draft saved on a branch from main', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch: 'globalwork',
        data: { heroTitle: 'branch draft only' },
        draft: true,
      })

      const mainDraft = await payload.findGlobal({
        slug: homepageGlobalSlug,
        draft: true,
      })

      expect(mainDraft.heroTitle).not.toBe('branch draft only')
    })
  })
})
