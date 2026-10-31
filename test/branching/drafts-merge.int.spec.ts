import type { Payload } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { branchChangesSlug, branchesSlug, pagesSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: drafts-merge', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test.describe('Drafts and publishing on a branch', () => {
    let pageID: number | string
    const cleanup: (number | string)[] = []

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'draftwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Draft work', slug: 'draftwork' },
        })
      }
    })

    test.beforeEach(async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on main' },
      })
      pageID = page.id
      cleanup.push(page.id)
    })

    test.afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: pagesSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: pagesSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: pagesSlug })
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    // Merging a published update applied it to main and dropped the branch's copy of
    // the row — but left the branch's *version* chain behind. The drafts list reads
    // through versions, so the branch went on listing the merged document a second
    // time alongside main's, as two identical published rows.
    test('should not duplicate a merged document in the branch drafts list', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
      })

      // Kept open, which is where the duplicate showed: closing the branch hides it
      // from the switcher, so nobody looked at its list again.
      await payload.branches.merge({ branch: 'draftwork' })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      const matching = onBranch.docs.filter((doc) => String(doc.id) === String(pageID))

      expect(matching).toHaveLength(1)
      expect(matching[0]!.title).toBe('published on branch')

      // And main has the merged content, exactly once.
      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: pageID } },
      })

      expect(onMain.docs).toHaveLength(1)
      expect(onMain.docs[0]!.title).toBe('published on branch')
    })

    // The same hazard from the other direction: a document *created* on the branch
    // keeps its row through the merge — the row is promoted to main rather than
    // recreated — so its branch-scoped version rows had to stop being branch-scoped
    // with it, or the branch listed the promoted document twice.
    test('should not duplicate a document created on the branch after it merges', async () => {
      const created = await payload.create({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'created on branch' },
      })

      cleanup.push(created.id)

      await payload.branches.merge({ branch: 'draftwork' })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      const matching = onBranch.docs.filter((doc) => doc.title === 'created on branch')

      expect(matching).toHaveLength(1)

      // The other edge of the same fix: the promoted row's chain is cleared *before*
      // main's first version is written, not after, or clearing it would take that
      // version with it and drop a published document out of main's own drafts list.
      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { title: { equals: 'created on branch' } },
      })

      expect(onMain.docs).toHaveLength(1)
    })
  })
})
