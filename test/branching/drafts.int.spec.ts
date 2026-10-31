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

test.suite('Branching: drafts', { config: './config.ts', resetBetweenTests: false }, () => {
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

    test('should hide a draft saved on a branch from main', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const mainDraft = await payload.findByID({
        id: pageID,
        collection: pagesSlug,
        draft: true,
      })

      expect(mainDraft.title).toBe('published on main')
    })

    test('should return the branch draft when reading drafts on the branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const branchDraft = await payload.findByID({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
      })

      expect(branchDraft.title).toBe('draft on branch')
    })

    test('should not publish on main when publishing on a branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'published', title: 'published on branch' },
      })

      const onMain = await payload.findByID({ id: pageID, collection: pagesSlug })
      const onBranch = await payload.findByID({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
      })

      expect(onMain.title).toBe('published on main')
      expect(onBranch.title).toBe('published on branch')
    })

    test('should keep version history isolated per branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const mainVersions = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      for (const version of mainVersions.docs) {
        expect(version.version.title).not.toBe('draft on branch')
      }
    })

    test('should list drafts on a branch without duplicating the main document', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      const matching = onBranch.docs.filter((doc) => String(doc.id) === String(pageID))

      expect(matching).toHaveLength(1)
      expect(matching[0]!.title).toBe('draft on branch')
    })

    // A tombstone is a flag on the collection row, which version rows know
    // nothing about — so a document deleted on a branch kept its branch version
    // chain, and a drafts-enabled collection went on listing it. The list view
    // reads drafts, so the row stayed put while every other read treated the
    // document as gone, including the edit view behind it.
    test('should hide a document deleted on a branch from that branch drafts list', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(pageID))
    })

    test('should still list a document deleted on a branch when reading drafts on main', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(pageID))
    })

    // The delete cascaded to versions by canonical ID before the tombstone was
    // decided, so main lost its version chain while keeping its row — production
    // history destroyed by a branch that is supposed to be isolated from it.
    test('should leave main version history intact when deleting on a branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const mainVersions = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      expect(mainVersions.docs.length).toBeGreaterThan(0)

      const mainDraft = await payload.findByID({
        id: pageID,
        collection: pagesSlug,
        draft: true,
      })

      expect(mainDraft.title).toBe('published on main')
    })

    test('should hide a document deleted on a branch without a prior branch edit', async () => {
      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
      })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(pageID))
    })

    // §7 originally said the fork should copy main's `latest` version into the
    // branch. It does not, and it should not: a branch's history reads as a
    // continuation of main's, so main's own rows are the ancestry and copying them
    // would duplicate every one.
    test('should show main history up to the fork point as the branch ancestry', async () => {
      await payload.update({
        id: pageID,
        collection: pagesSlug,
        data: { title: 'unpublished draft on main' },
        draft: true,
      })

      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on branch' },
        draft: true,
      })

      const history = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      const titles = history.docs.map((doc) => doc.version?.title)

      expect(titles).toContain('edited on branch')
      expect(titles).toContain('unpublished draft on main')
      expect(titles).toContain('published on main')

      // Every row reports the document it belongs to, not the shadow row.
      for (const doc of history.docs) {
        const parent = (doc as { parent?: unknown }).parent

        expect(String((parent as { value?: unknown })?.value ?? parent)).toBe(String(pageID))
      }
    })

    test('should exclude main versions recorded after the branch forked', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on branch' },
        draft: true,
      })

      await payload.update({
        id: pageID,
        collection: pagesSlug,
        data: { title: 'later draft on main' },
        draft: true,
      })

      const history = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const counted = await payload.countVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        where: { parent: { equals: pageID } },
      })
      const titles = history.docs.map((doc) => doc.version?.title)

      expect(titles).toContain('edited on branch')
      expect(titles).toContain('published on main')
      expect(titles).not.toContain('later draft on main')
      expect(counted.totalDocs).toBe(history.docs.length)
    })

    test('should preserve the version fork boundary when update becomes delete', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on branch' },
        draft: true,
      })

      const beforeDelete = (
        await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: {
            and: [
              { branch: { equals: 'draftwork' } },
              { collectionSlug: { equals: pagesSlug } },
              { documentID: { equals: String(pageID) } },
            ],
          },
        })
      ).docs[0] as unknown as {
        baseUpdatedAt?: string
        baseVersionID?: string
        baseVersionUpdatedAt?: string
      }

      expect(beforeDelete.baseUpdatedAt).toBeTruthy()
      expect(beforeDelete.baseVersionID).toBeTruthy()
      expect(beforeDelete.baseVersionUpdatedAt).toBeTruthy()

      await payload.delete({ id: pageID, branch: 'draftwork', collection: pagesSlug })

      const afterDelete = (
        await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: {
            and: [
              { branch: { equals: 'draftwork' } },
              { collectionSlug: { equals: pagesSlug } },
              { documentID: { equals: String(pageID) } },
            ],
          },
        })
      ).docs[0] as unknown as {
        baseUpdatedAt?: string
        baseVersionID?: string
        baseVersionUpdatedAt?: string
        operation?: string
      }

      expect(afterDelete).toMatchObject({
        baseUpdatedAt: beforeDelete.baseUpdatedAt,
        baseVersionID: beforeDelete.baseVersionID,
        baseVersionUpdatedAt: beforeDelete.baseVersionUpdatedAt,
        operation: 'delete',
      })
    })

    // The Versions tab count and the Versions list came from different queries, and
    // only the list was branch-aware — so the tab said 3 while 4 rows rendered.
    test('should count versions the same way it lists them on a branch', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on branch' },
        draft: true,
      })

      const listed = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const counted = await payload.countVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        where: { parent: { equals: pageID } },
      })

      expect(counted.totalDocs).toBe(listed.docs.length)

      const listedOnMain = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const countedOnMain = await payload.countVersions({
        collection: pagesSlug,
        where: { parent: { equals: pageID } },
      })

      expect(countedOnMain.totalDocs).toBe(listedOnMain.docs.length)
      expect(counted.totalDocs).toBeGreaterThan(countedOnMain.totalDocs)
    })

    test('should keep one branch out of another branch history', async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'otherwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Other work', slug: 'otherwork' },
        })
      }

      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'edited on draftwork' },
        draft: true,
      })
      await payload.update({
        id: pageID,
        branch: 'otherwork',
        collection: pagesSlug,
        data: { title: 'edited on otherwork' },
        draft: true,
      })

      const onDraftwork = await payload.findVersions({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })
      const onMain = await payload.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { parent: { equals: pageID } },
      })

      const draftworkTitles = onDraftwork.docs.map((doc) => doc.version?.title)

      expect(draftworkTitles).toContain('edited on draftwork')
      expect(draftworkTitles).not.toContain('edited on otherwork')
      expect(onMain.docs.map((doc) => doc.version?.title)).not.toContain('edited on draftwork')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'otherwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should record a draft-only document created on a branch in the changeset registry', async () => {
      const created = await payload.create({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'draft', title: 'draft created on branch' },
        draft: true,
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]?.operation).toBe('create')
      expect(changes.docs[0]?.collectionSlug).toBe(pagesSlug)
      expect((changes.docs[0]?.doc as { value?: unknown })?.value).toBe(created.id)
    })

    test('should record a draft edit to a main document as an update in the changeset registry', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'draft on branch' },
        draft: true,
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]?.operation).toBe('update')
      expect((changes.docs[0]?.doc as { value?: unknown })?.value).toBe(pageID)
    })

    test('should record a draft created through the REST API with a branch param', async () => {
      const res = await restClient.POST(`/${pagesSlug}?branch=draftwork&draft=true`, {
        body: JSON.stringify({ _status: 'draft', title: 'rest draft on branch' }),
        headers: { Authorization: `JWT ${token}` },
      })
      const { doc } = await res.json()

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'draftwork' } },
      })

      expect(res.status).toBe(201)
      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]?.operation).toBe('create')
      expect(String((changes.docs[0]?.doc as { value?: unknown })?.value)).toBe(String(doc.id))
    })

    // What the admin panel's API tab does: read one document by ID over REST with a
    // `branch` param. The tab showed main's copy while sitting on a branch.
    test('should return the branch copy when reading one document by ID over REST', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'updated on branch' },
      })

      const res = await restClient.GET(`/${pagesSlug}/${pageID}?branch=draftwork&depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })
      const doc = await res.json()

      expect(res.status).toBe(200)
      expect(doc.title).toBe('updated on branch')

      // And main is unaffected by the same read, so this is scoping and not leakage.
      const onMain = await restClient.GET(`/${pagesSlug}/${pageID}?depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect((await onMain.json()).title).toBe('published on main')
    })

    // Writes over REST had no branch coverage at all, and a write that silently lands
    // on main is strictly worse than a read that silently returns it.
    test('should fork onto the branch when updating through REST with a branch param', async () => {
      const res = await restClient.PATCH(`/${pagesSlug}/${pageID}?branch=draftwork&depth=0`, {
        body: JSON.stringify({ title: 'patched on branch' }),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)

      const onBranch = await payload.findByID({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
      })
      const onMain = await payload.findByID({ id: pageID, collection: pagesSlug })

      expect(onBranch.title).toBe('patched on branch')
      expect(onMain.title).toBe('published on main')
    })

    test('should tombstone rather than delete when deleting through REST with a branch param', async () => {
      const res = await restClient.DELETE(`/${pagesSlug}/${pageID}?branch=draftwork&depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)

      // Gone on the branch, still on main — the whole point of a tombstone.
      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        pagination: false,
        where: { id: { equals: pageID } },
      })
      const onMain = await payload.findByID({ id: pageID, collection: pagesSlug })

      expect(onBranch.docs).toHaveLength(0)
      expect(onMain.title).toBe('published on main')
    })

    // Listing was never broken — `find` hands the adapter the whole request, so the
    // query param was visible to it. Pinned anyway: the bug was the *divergence*
    // between the two reads, and a list that silently stopped agreeing with a
    // by-ID read would be the same defect wearing different clothes.
    test('should return the branch copy when listing documents over REST', async () => {
      await payload.update({
        id: pageID,
        branch: 'draftwork',
        collection: pagesSlug,
        data: { title: 'updated on branch' },
      })

      const res = await restClient.GET(`/${pagesSlug}?branch=draftwork&depth=0`, {
        headers: { Authorization: `JWT ${token}` },
      })
      const { docs } = await res.json()

      const matching = docs.filter((doc: { id: number | string }) => {
        return String(doc.id) === String(pageID)
      })

      expect(matching).toHaveLength(1)
      expect(matching[0].title).toBe('updated on branch')
    })

    test('should keep a draft created on a branch off main', async () => {
      const created = await payload.create({
        branch: 'draftwork',
        collection: pagesSlug,
        data: { _status: 'draft', title: 'draft created on branch' },
        draft: true,
      })

      const onMain = await payload.find({
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: created.id } },
      })
      const onBranch = await payload.find({
        branch: 'draftwork',
        collection: pagesSlug,
        draft: true,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(onMain.docs).toHaveLength(0)
      expect(onBranch.docs).toHaveLength(1)
    })
  })
})
