import type { Payload } from 'payload'

import { createPayloadRequest, resolveEffectiveOperations } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { autosaveSlug, branchChangesSlug, branchesSlug, pagesSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite('Branching: merge-drafts', { config: './config.ts', resetBetweenTests: false }, () => {
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
   * §7's effective-operation table. A branch edit that was only ever saved as a
   * draft never touches the document row, so merge cannot read the row alone and
   * has to consult the branch's version chain to know what it is applying.
   */
  test.describe('Merging drafts and publishes', () => {
    let pageID: number | string

    test.beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Draft merge', slug: 'draftmerge' },
      })

      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on main' },
      })

      pageID = page.id
    })

    test.afterEach(async () => {
      for (const collection of [autosaveSlug, pagesSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection })
        }
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: {
            [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'draftmerge' },
          },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    test('should merge a draft-only branch edit as a draft, leaving main published state alone', async () => {
      const before = await payload.findByID({ id: pageID, collection: pagesSlug })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({ id: pageID, collection: pagesSlug })
      const latest = await payload.findByID({ id: pageID, collection: pagesSlug, draft: true })
      const rows = await payload.find({
        branch: false,
        collection: pagesSlug,
        pagination: false,
        showHiddenFields: true,
      })

      expect(published.title).toBe('published on main')
      expect(published.updatedAt).toBe(before.updatedAt)
      expect(latest.title).toBe('draft on branch')
      expect(latest._status).toBe('draft')
      expect(rows.docs.every((row) => row._branch === 'main')).toBe(true)
    })

    test('should report a draft-only branch edit as an update rather than a publish', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const resolved = await resolveEffectiveOperations({
        branch: 'draftmerge',
        changes: (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: 'draftmerge' } },
          })
        ).docs,
        payload,
        req: await createPayloadRequest({ branch: false, payload }),
      })

      expect(resolved).toHaveLength(1)
      expect(resolved[0]!.writes.map((write) => write.operation)).toEqual(['update'])
    })

    test('should merge a publish on a branch as a publish to main', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'first publish on branch' },
      })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'latest publish on branch' },
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({ id: pageID, collection: pagesSlug })

      expect(published.title).toBe('latest publish on branch')
      expect(published._status).toBe('published')
    })

    test('should apply only the latest draft after an earlier branch publish', async () => {
      const mainVersionsBefore = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'first publish on branch' },
      })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'latest publish on branch' },
      })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'first draft after publishing' },
        draft: true,
      })

      await payload.update({
        id: pageID,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'drafted after publishing' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({ id: pageID, collection: pagesSlug })
      const latest = await payload.findByID({ id: pageID, collection: pagesSlug, draft: true })
      const mainVersionsAfter = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      expect(published.title).toBe('published on main')
      expect(latest.title).toBe('drafted after publishing')
      expect(latest._status).toBe('draft')
      expect(mainVersionsAfter.docs).toHaveLength(mainVersionsBefore.docs.length + 1)
    })

    test('should merge only the latest autosave', async () => {
      const autosaveDocument = await payload.create({
        collection: autosaveSlug,
        data: { _status: 'published', title: 'autosave published on main' },
      })
      const mainVersionsBefore = await payload.findVersions({
        collection: autosaveSlug,
        pagination: false,
        where: { parent: { equals: autosaveDocument.id } },
      })

      for (const title of ['first autosave', 'second autosave', 'latest autosave']) {
        await payload.update({
          id: autosaveDocument.id,
          autosave: true,
          branch: 'draftmerge',
          collection: autosaveSlug,
          data: { title },
          draft: true,
        })
      }

      await payload.branches.merge({ branch: 'draftmerge' })

      const published = await payload.findByID({
        id: autosaveDocument.id,
        collection: autosaveSlug,
      })
      const latest = await payload.findByID({
        id: autosaveDocument.id,
        collection: autosaveSlug,
        draft: true,
      })
      const mainVersionsAfter = await payload.findVersions({
        collection: autosaveSlug,
        pagination: false,
        where: { parent: { equals: autosaveDocument.id } },
      })

      expect(published.title).toBe('autosave published on main')
      expect(latest.title).toBe('latest autosave')
      expect(latest._status).toBe('draft')
      expect(mainVersionsAfter.docs).toHaveLength(mainVersionsBefore.docs.length + 1)
    })

    test('should merge a draft created on a branch as an unpublished document on main', async () => {
      const created = await payload.create({
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'draft', title: 'draft created on branch' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: created.id } },
      })
      const publishedOnMain = await payload.find({
        collection: pagesSlug,
        pagination: false,
        where: { id: { equals: created.id } },
      })
      const mainVersions = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: created.id } },
      })

      expect(onMain.docs).toHaveLength(1)
      expect(onMain.docs[0]!._status).toBe('draft')
      expect(onMain.docs[0]!.title).toBe('draft created on branch')
      expect(publishedOnMain.docs).toHaveLength(1)
      expect(publishedOnMain.docs[0]!._status).toBe('draft')
      expect(mainVersions.docs.map(({ version }) => version._status)).not.toContain('published')
    })

    test('should create only the latest draft after an earlier branch publication', async () => {
      const created = await payload.create({
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { _status: 'published', title: 'branch-created publication' },
      })

      await payload.update({
        id: created.id,
        branch: 'draftmerge',
        collection: pagesSlug,
        data: { title: 'newer branch-created draft' },
        draft: true,
      })

      await payload.branches.merge({ branch: 'draftmerge' })

      const onMain = await payload.findByID({
        id: created.id,
        collection: pagesSlug,
        draft: true,
      })
      const mainVersions = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: created.id } },
      })

      expect(onMain.title).toBe('newer branch-created draft')
      expect(onMain._status).toBe('draft')
      expect(mainVersions.docs).toHaveLength(1)
      expect(mainVersions.docs[0]?.version.title).toBe('newer branch-created draft')
      expect(mainVersions.docs[0]?.version._status).toBe('draft')
    })
  })
})
