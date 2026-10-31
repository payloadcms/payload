import type { Payload } from 'payload'

import { createPayloadRequest } from 'payload'

import { expect } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, postsSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: merge-execution',
  { config: './config.ts', resetBetweenTests: false },
  () => {
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

    test.describe('Merge', () => {
      let mainDocID: number | string
      let branchOnlyID: number | string
      const cleanup: (number | string)[] = []

      test.beforeEach(async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Merge me', slug: 'mergeme' },
        })

        const main = await payload.create({
          collection: postsSlug,
          data: { order: 1, title: 'original on main' },
        })
        mainDocID = main.id
        cleanup.push(main.id)

        const created = await payload.create({
          branch: 'mergeme',
          collection: postsSlug,
          data: { order: 2, title: 'created on branch' },
        })
        branchOnlyID = created.id

        await payload.update({
          id: mainDocID,
          branch: 'mergeme',
          collection: postsSlug,
          data: { title: 'edited on branch' },
        })
      })

      test.afterEach(async () => {
        const rows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection: postsSlug })
        }
        cleanup.length = 0

        for (const slug of ['mergeme']) {
          const changes = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: slug } },
          })

          for (const change of changes.docs) {
            await payload.delete({ id: change.id, collection: branchChangesSlug })
          }

          const branches = await payload.find({
            collection: branchesSlug,
            pagination: false,
            where: { slug: { equals: slug } },
          })

          for (const branchDoc of branches.docs) {
            await payload.delete({ id: branchDoc.id, collection: branchesSlug })
          }
        }
      })

      test('should report pending changes without mutating anything on dryRun', async () => {
        const result = await payload.branches.merge({ branch: 'mergeme', dryRun: true })

        expect(result.mergeable).toHaveLength(2)

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })

      test('should apply every change and finalize the branch state', async () => {
        await payload.branches.merge({ branch: 'mergeme' })

        const editedOnMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
        const createdOnMain = await payload.findByID({ id: branchOnlyID, collection: postsSlug })
        const rows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'mergeme' } },
        })
        const branchDoc = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'mergeme' } },
        })

        expect(editedOnMain.title).toBe('edited on branch')
        expect(createdOnMain.title).toBe('created on branch')
        expect(String(createdOnMain.id)).toBe(String(branchOnlyID))
        expect(rows.docs.every((doc) => doc._branch === 'main')).toBe(true)
        expect(changes.docs).toHaveLength(0)
        expect(branchDoc.docs[0]!.status).toBe('merged')
      })

      test('should reject an update change when its branch row is missing', async () => {
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: {
            and: [
              { branch: { equals: 'mergeme' } },
              { collectionSlug: { equals: postsSlug } },
              { documentID: { equals: String(mainDocID) } },
            ],
          },
        })
        const change = changes.docs[0]!
        const shadow = await payload.db.findOne({
          branch: false,
          collection: postsSlug,
          req: await createPayloadRequest({ branch: false, payload }),
          where: {
            and: [{ _branch: { equals: 'mergeme' } }, { _branchDocID: { equals: mainDocID } }],
          },
        })

        await payload.db.deleteOne({
          branch: false,
          collection: postsSlug,
          req: await createPayloadRequest({ branch: false, payload }),
          where: { id: { equals: shadow!.id } },
        })

        await expect(
          payload.branches.merge({ branch: 'mergeme', changes: [change.id] }),
        ).rejects.toMatchObject({ status: 409 })

        const remainingChanges = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { id: { equals: change.id } },
        })
        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(remainingChanges.docs).toHaveLength(1)
        expect(onMain.title).toBe('original on main')
      })

      test('should apply only the selected changes and leave the rest on an open branch', async () => {
        const preflight = await payload.branches.merge({ branch: 'mergeme', dryRun: true })
        const editChange = preflight.mergeable.find(
          (change) => String(change.docID) === String(mainDocID),
        )

        await payload.branches.merge({ branch: 'mergeme', changes: [editChange!.changeID] })

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
        const remaining = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'mergeme' } },
        })
        const branchDoc = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'mergeme' } },
        })

        expect(onMain.title).toBe('edited on branch')
        expect(remaining.docs).toHaveLength(1)
        expect(branchDoc.docs[0]!.status).toBe('open')
      })

      test('should refresh the caller request after merging a change', async () => {
        const req = await createPayloadRequest({ branch: 'mergeme', payload })
        const beforeMerge = await payload.findByID({ id: mainDocID, collection: postsSlug, req })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: {
            and: [
              { branch: { equals: 'mergeme' } },
              { collectionSlug: { equals: postsSlug } },
              { documentID: { equals: String(mainDocID) } },
            ],
          },
        })

        await payload.branches.merge({
          branch: 'mergeme',
          changes: [changes.docs[0]!.id],
          overrideAccess: true,
          req,
        })

        const afterMerge = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

        expect(beforeMerge.title).toBe('edited on branch')
        expect(afterMerge.title).toBe('edited on branch')
      })

      test('should apply a branch delete to main', async () => {
        await payload.delete({ id: mainDocID, branch: 'mergeme', collection: postsSlug })
        await payload.branches.merge({ branch: 'mergeme' })

        const onMain = await payload.find({
          collection: postsSlug,
          pagination: false,
          where: { id: { equals: mainDocID } },
        })

        expect(onMain.docs).toHaveLength(0)
      })

      test('should warn when main moved after the document was branched', async () => {
        await payload.update({
          id: mainDocID,
          collection: postsSlug,
          data: { title: 'changed on main after fork' },
        })

        const result = await payload.branches.merge({ branch: 'mergeme', dryRun: true })
        const warning = result.warnings.find((each) => each.reason === 'main-moved')

        expect(warning).toBeDefined()
        expect(String(warning!.docID)).toBe(String(mainDocID))
      })

      test('should overwrite main even when main moved after the fork', async () => {
        await payload.update({
          id: mainDocID,
          collection: postsSlug,
          data: { title: 'changed on main after fork' },
        })

        await payload.branches.merge({ branch: 'mergeme' })

        const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

        expect(onMain.title).toBe('edited on branch')
      })

      test('should fire afterChange hooks on merge with the right operation', async () => {
        const calls: { operation: string; title: unknown }[] = []

        hookSpy.afterChange = (args) => {
          calls.push({ operation: args.operation, title: args.doc.title })
        }

        await payload.branches.merge({ branch: 'mergeme' })

        hookSpy.afterChange = undefined

        expect(calls.some((c) => c.operation === 'create' && c.title === 'created on branch')).toBe(
          true,
        )
        expect(calls.some((c) => c.operation === 'update' && c.title === 'edited on branch')).toBe(
          true,
        )
      })

      test('should re-run beforeChange hooks on merge', async () => {
        let ran = 0

        hookSpy.beforeChange = () => {
          ran += 1
        }

        await payload.branches.merge({ branch: 'mergeme' })

        hookSpy.beforeChange = undefined

        expect(ran).toBeGreaterThan(0)
      })
    })
  },
)
