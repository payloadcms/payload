import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import {
  branchChangesSlug,
  branchesSlug,
  branchMergesSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: global-merge', { config: './config.ts', resetBetweenTests: false }, () => {
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

  /**
   * A global edited on a branch was recorded in the change registry and then ignored by
   * both merge and discard, which filtered the registry to collections — so the edit was
   * permanently stuck on the branch, visible in the changeset and impossible to act on.
   */
  test.describe('Globals through merge and discard', () => {
    const branch = 'globalwork'
    let branchID: number | string

    test.beforeEach(async () => {
      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'Global work', slug: branch },
      })

      branchID = branchDoc.id

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main label' },
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch,
        data: { navLabel: 'branch label' },
      })
    })

    test.afterEach(async () => {
      hookSpy.postBeforeRead = undefined
      hookSpy.restrictLedgerSnapshotGlobalRead = undefined

      for (const collection of [branchChangesSlug, branchMergesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { branch: { equals: branch } },
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, collection }).catch(() => {})
        }
      }

      await payload.delete({ id: branchID, collection: branchesSlug }).catch(() => {})

      const ledgerReaders = await payload.find({
        collection: 'users',
        pagination: false,
        where: { email: { equals: 'ledger-reader@example.com' } },
      })

      for (const ledgerReader of ledgerReaders.docs) {
        await payload.delete({ id: ledgerReader.id, collection: 'users' })
      }
    })

    test('should record the global edit as a pending change', async () => {
      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]!.entityType).toBe('global')
      expect(changes.docs[0]!.globalSlug).toBe(headerGlobalSlug)
    })

    test('should apply a global edit to main on merge', async () => {
      const result = await payload.branches.merge({ branch })

      expect(result.merged).toHaveLength(1)
      expect(result.merged[0]!.globalSlug).toBe(headerGlobalSlug)

      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onMain.navLabel).toBe('branch label')
    })

    test('should read through to main again after merging a global', async () => {
      await payload.branches.merge({ branch })

      // The branch's copy is gone, so a later edit on main is visible on the branch —
      // which is the whole reason the copy has to be deleted rather than reset.
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'edited on main afterwards' },
      })

      const onBranch = await payload.findGlobal({ slug: headerGlobalSlug, branch })

      expect(onBranch.navLabel).toBe('edited on main afterwards')
    })

    test('should close the branch when the only change was a global', async () => {
      await payload.branches.merge({ branch, closeBranch: true })

      const branchDoc = await payload.findByID({ id: branchID, collection: branchesSlug })

      expect(branchDoc.status).toBe('closed')
    })

    test('should record the merged global in the ledger', async () => {
      await payload.branches.merge({ branch })

      const merges = await payload.find({
        collection: branchMergesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(merges.docs).toHaveLength(1)

      const changes = merges.docs[0]!.changes as { globalSlug?: string }[]

      expect(changes).toHaveLength(1)
      expect(changes[0]!.globalSlug).toBe(headerGlobalSlug)
    })

    test('should not run global read hooks or store snapshots for a merge event', async () => {
      const mergingUser = await payload.create({
        collection: 'users',
        data: { email: 'ledger-reader@example.com', password: 'test' },
      })

      hookSpy.postBeforeRead = () => {
        throw new Error('snapshot global read hook must not run')
      }
      const result = await payload.branches.merge({
        branch,
        overrideAccess: true,
        user: { ...mergingUser, collection: 'users' } as never,
      })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: branch } },
        })
      ).docs[0]! as unknown as {
        changes: { after?: null | Record<string, unknown>; before?: Record<string, unknown> }[]
      }

      expect(result.merged).toHaveLength(1)
      expect(event.changes[0]?.before == null).toBe(true)
      expect(event.changes[0]?.after == null).toBe(true)
    })

    test('should return the global to main state on discard', async () => {
      const result = await payload.branches.discard({ branch })

      expect(result.discarded).toHaveLength(1)

      const onBranch = await payload.findGlobal({ slug: headerGlobalSlug, branch })
      const onMain = await payload.findGlobal({ slug: headerGlobalSlug })

      expect(onBranch.navLabel).toBe('main label')
      expect(onMain.navLabel).toBe('main label')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(changes.docs).toHaveLength(0)
    })
  })

  test.describe('Versioned globals through merge and discard', () => {
    const branch = 'versioned-global-work'

    const cleanBranchState = async () => {
      const req = await createPayloadRequest({ branch: false, payload })

      await payload.db.deleteVersions({
        globalSlug: homepageGlobalSlug,
        req,
        where: { _branch: { equals: branch } },
      })
      await payload.db.deleteBranchGlobal?.({ branch, globalSlug: homepageGlobalSlug, req })

      for (const collection of [branchChangesSlug, branchMergesSlug]) {
        const rows = await payload.find({
          collection,
          overrideAccess: true,
          pagination: false,
          where: { branch: { equals: branch } },
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, collection, overrideAccess: true })
        }
      }

      const branches = await payload.find({
        collection: branchesSlug,
        overrideAccess: true,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      for (const branchDoc of branches.docs) {
        await payload.delete({
          id: branchDoc.id,
          collection: branchesSlug,
          overrideAccess: true,
        })
      }
    }

    test.beforeEach(async () => {
      await cleanBranchState()
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Versioned global work', slug: branch },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', heroTitle: 'main published' },
      })
    })

    test.afterEach(async () => {
      hookSpy.homepageGlobalAccessWrites = undefined
      await cleanBranchState()
    })

    test('should record and discard a draft-only global change', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'branch draft' },
        draft: true,
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]!.globalSlug).toBe(homepageGlobalSlug)

      await payload.branches.discard({ branch })

      const branchVersions = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        branch: false,
        overrideAccess: true,
        pagination: false,
        where: { _branch: { equals: branch } },
      })

      expect(branchVersions.docs).toHaveLength(0)
    })

    test('should record a restored global version as a branch change', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', heroTitle: 'branch historical' },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', heroTitle: 'branch current' },
      })

      const versions = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        branch,
        pagination: false,
      })
      const historicalVersion = versions.docs.find(
        ({ version }) => version.heroTitle === 'branch historical',
      )
      const existingChanges = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      expect(historicalVersion).toBeDefined()

      for (const change of existingChanges.docs) {
        await payload.delete({
          id: change.id,
          collection: branchChangesSlug,
          overrideAccess: true,
        })
      }

      await payload.restoreGlobalVersion({
        id: historicalVersion!.id,
        slug: homepageGlobalSlug,
        branch,
        overrideAccess: true,
      })

      const restoredChanges = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })
      const restoredOnBranch = await payload.findGlobal({
        slug: homepageGlobalSlug,
        branch,
        draft: true,
      })

      expect(restoredChanges.docs).toHaveLength(1)
      expect(restoredChanges.docs[0]!.globalSlug).toBe(homepageGlobalSlug)
      expect(restoredOnBranch.heroTitle).toBe('branch historical')
    })

    test('should merge a draft-only global without changing its published value', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'branch draft' },
        draft: true,
      })

      const result = await payload.branches.merge({ branch })
      const publishedOnMain = await payload.findGlobal({ slug: homepageGlobalSlug })
      const draftOnMain = await payload.findGlobal({ slug: homepageGlobalSlug, draft: true })

      expect(result.merged).toHaveLength(1)
      expect(publishedOnMain.heroTitle).toBe('main published')
      expect(draftOnMain.heroTitle).toBe('branch draft')
    })

    test('should record the exact target versions for a versioned global merge', async () => {
      const req = await createPayloadRequest({ branch: false, payload })
      const beforeVersions = await payload.db.findGlobalVersions({
        branch: false,
        global: homepageGlobalSlug,
        limit: 1,
        pagination: false,
        req,
        sort: '-updatedAt',
        where: { _branch: { equals: 'main' } },
      })

      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'global version reference after' },
        draft: true,
      })
      await payload.branches.merge({ branch })

      const afterVersions = await payload.db.findGlobalVersions({
        branch: false,
        global: homepageGlobalSlug,
        limit: 1,
        pagination: false,
        req,
        sort: '-updatedAt',
        where: { _branch: { equals: 'main' } },
      })
      const mergeEvent = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: branch } },
        })
      ).docs[0] as unknown as {
        changes: { afterVersionID?: string; beforeVersionID?: string }[]
      }

      expect(mergeEvent.changes[0]?.beforeVersionID).toBe(String(beforeVersions.docs[0]?.id))
      expect(mergeEvent.changes[0]?.afterVersionID).toBe(String(afterVersions.docs[0]?.id))
      expect(mergeEvent.changes[0]?.afterVersionID).not.toBe(mergeEvent.changes[0]?.beforeVersionID)
    })

    test('should merge only the latest global draft after an earlier branch publish', async () => {
      const mainVersionsBefore = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        pagination: false,
      })

      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', heroTitle: 'branch published' },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'branch draft' },
        draft: true,
      })

      await payload.branches.merge({ branch })

      const publishedOnMain = await payload.findGlobal({ slug: homepageGlobalSlug })
      const draftOnMain = await payload.findGlobal({ slug: homepageGlobalSlug, draft: true })
      const mainVersionsAfter = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        pagination: false,
      })

      expect(publishedOnMain.heroTitle).toBe('main published')
      expect(draftOnMain.heroTitle).toBe('branch draft')
      expect(mainVersionsAfter.docs).toHaveLength(mainVersionsBefore.docs.length + 1)
    })

    test('should merge every localized value of a versioned global', async () => {
      const mainVersionsBefore = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        pagination: false,
      })

      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', localizedTitle: 'main English' },
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', localizedTitle: 'main Spanish' },
        locale: 'es',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', localizedTitle: 'branch English' },
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', localizedTitle: 'branch Spanish' },
        locale: 'es',
      })

      await payload.branches.merge({ branch })

      const mainEN = await payload.findGlobal({ slug: homepageGlobalSlug, locale: 'en' })
      const mainES = await payload.findGlobal({ slug: homepageGlobalSlug, locale: 'es' })
      const mainVersionsAfter = await payload.findGlobalVersions({
        slug: homepageGlobalSlug,
        locale: 'all',
        pagination: false,
      })

      expect(mainEN.localizedTitle).toBe('branch English')
      expect(mainES.localizedTitle).toBe('branch Spanish')
      expect(mainVersionsAfter.docs).toHaveLength(mainVersionsBefore.docs.length + 3)
      expect(mainVersionsAfter.docs[0]?.version.localizedTitle).toEqual({
        en: 'branch English',
        es: 'branch Spanish',
      })
    })

    test('should preserve each locale status from the latest global version', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', localizedTitle: 'main English' },
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', localizedTitle: 'main Spanish' },
        locale: 'es',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', localizedTitle: 'branch English' },
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { localizedTitle: 'branch Spanish draft' },
        draft: true,
        locale: 'es',
      })

      await payload.branches.merge({ branch })

      const publishedEN = await payload.findGlobal({ slug: homepageGlobalSlug, locale: 'en' })
      const publishedES = await payload.findGlobal({ slug: homepageGlobalSlug, locale: 'es' })
      const draftES = await payload.findGlobal({
        slug: homepageGlobalSlug,
        draft: true,
        locale: 'es',
      })

      expect(publishedEN.localizedTitle).toBe('branch English')
      expect(publishedES.localizedTitle).toBe('main Spanish')
      expect(draftES.localizedTitle).toBe('branch Spanish draft')
    })

    test('should check access against every exact global write and locale', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: {
          _status: 'published',
          heroTitle: 'branch published',
          localizedTitle: 'published English',
        },
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: {
          _status: 'published',
          heroTitle: 'branch published',
          localizedTitle: 'published Spanish',
        },
        locale: 'es',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'branch draft', localizedTitle: 'draft English' },
        draft: true,
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'branch draft', localizedTitle: 'draft Spanish' },
        draft: true,
        locale: 'es',
      })

      hookSpy.homepageGlobalAccessWrites = []

      await payload.branches.merge({
        branch,
        dryRun: true,
        overrideAccess: false,
        user: (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0] as never,
      })

      expect(hookSpy.homepageGlobalAccessWrites).toEqual([
        { heroTitle: 'branch draft', locale: 'en', localizedTitle: 'draft English' },
        { heroTitle: 'branch draft', locale: 'es', localizedTitle: 'draft Spanish' },
      ])
    })

    test('should block a global draft allowed only by branch metadata', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', heroTitle: 'published before draft' },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { heroTitle: 'draft allowed only off main' },
        draft: true,
      })

      const result = await payload.branches.merge({
        branch,
        dryRun: true,
        overrideAccess: false,
        user: (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0] as never,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({ globalSlug: homepageGlobalSlug, operation: 'update' }),
      )
    })

    test('should block a global when one exact draft locale is denied', async () => {
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', localizedTitle: 'published English' },
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { _status: 'published', localizedTitle: 'published Spanish' },
        locale: 'es',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { localizedTitle: 'draft English' },
        draft: true,
        locale: 'en',
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch,
        data: { localizedTitle: 'blocked Spanish draft' },
        draft: true,
        locale: 'es',
      })

      const result = await payload.branches.merge({
        branch,
        dryRun: true,
        overrideAccess: false,
        user: (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { email: { equals: devUser.email } },
          })
        ).docs[0] as never,
      })

      expect(result.blocked).toContainEqual(
        expect.objectContaining({ globalSlug: homepageGlobalSlug, operation: 'update' }),
      )
    })
  })
})
