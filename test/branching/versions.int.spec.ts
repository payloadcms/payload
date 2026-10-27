import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import {
  autosaveSlug,
  branchChangesSlug,
  branchesSlug,
  maxVersionsSlug,
  pagesSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: versions', { config: './config.ts', resetBetweenTests: false }, () => {
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
   * The two version writes that are not branch-aware. Both destroy production history
   * rather than branch history, which is the worst direction for this to fail in.
   */
  test.describe('Version writes that must stay off main', () => {
    const branch = 'versionwrites'

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Version writes', slug: branch },
        })
      }
    })

    test.afterEach(async () => {
      for (const collection of [maxVersionsSlug, autosaveSlug, pagesSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
        }
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    // `enforceMaxVersions` probes with a branch-aware read — so on a branch it counts
    // main's ancestry too — and then deletes by canonical `parent` with no `_branch`
    // scoping. Pruning on a branch therefore deleted main's version rows and left the
    // branch's own chain (which hangs off the shadow row) untouched.
    test('should prune only the branch chain when max versions is reached on a branch', async () => {
      const doc = await payload.create({
        collection: maxVersionsSlug,
        data: { _status: 'published', title: 'main v1' },
      })

      await payload.update({
        id: doc.id,
        collection: maxVersionsSlug,
        data: { _status: 'published', title: 'main v2' },
      })

      const mainVersionsBefore = await payload.countVersions({
        collection: maxVersionsSlug,
        where: { parent: { equals: doc.id } },
      })

      // Enough saves on the branch to trigger pruning there.
      for (const title of ['branch v1', 'branch v2', 'branch v3']) {
        await payload.update({
          id: doc.id,
          branch,
          collection: maxVersionsSlug,
          data: { _status: 'published', title },
        })
      }

      const mainVersionsAfter = await payload.countVersions({
        collection: maxVersionsSlug,
        where: { parent: { equals: doc.id } },
      })

      expect(mainVersionsAfter.totalDocs).toBe(mainVersionsBefore.totalDocs)

      // And main's document still reads as main's.
      const onMain = await payload.findByID({ id: doc.id, collection: maxVersionsSlug })

      expect(onMain.title).toBe('main v2')
    })

    // The same hazard reached through `unpublish` rather than autosave, which is where
    // it bites: the autosave path is protected by its `shouldUpdate` guard (main's
    // latest is not an autosave row, so it is left alone), but unpublish updates
    // whatever the latest row happens to be — and on a branch with no versions of its
    // own yet, that is main's.
    test('should not rewrite main latest version row when unpublishing on a branch', async () => {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on main' },
      })

      const before = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: doc.id } },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: pagesSlug,
        data: { _status: 'draft', title: 'unpublished on branch' },
        draft: true,
        unpublishAllLocales: true,
      })

      const after = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: doc.id } },
      })

      const titles = after.docs.map((version) => (version.version as { title?: string })?.title)

      expect(titles).not.toContain('unpublished on branch')
      expect(after.docs).toHaveLength(before.docs.length)

      // Main's document is still published, with main's content.
      const onMain = await payload.findByID({ id: doc.id, collection: pagesSlug, draft: true })

      expect(onMain.title).toBe('published on main')
      expect(onMain._status).toBe('published')
    })

    // `updateLatestVersion` finds by canonical `parent` — a branch-aware read, so it
    // returns main's latest row as part of the branch's ancestry — and then rewrites
    // that row through the branch-blind `db.updateVersion`.
    test('should not rewrite main latest version row when autosaving on a branch', async () => {
      const doc = await payload.create({
        collection: autosaveSlug,
        data: { _status: 'published', title: 'main published' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: autosaveSlug,
        data: { title: 'autosaved on branch' },
        draft: true,
      })

      const mainVersions = await payload.findVersions({
        collection: autosaveSlug,
        pagination: false,
        where: { parent: { equals: doc.id } },
      })

      const titles = mainVersions.docs.map(
        (version) => (version.version as { title?: string })?.title,
      )

      expect(titles).not.toContain('autosaved on branch')

      const onMain = await payload.findByID({ id: doc.id, collection: autosaveSlug, draft: true })

      expect(onMain.title).toBe('main published')
    })
  })
})
