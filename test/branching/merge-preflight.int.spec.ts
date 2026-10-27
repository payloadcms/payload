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
  headerGlobalSlug,
  localizedSlug,
  nestedSlug,
  pagesSlug,
  publicSlug,
  restrictedSlug,
  whereAccessSlug,
} from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: merge-preflight',
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

    test.describe('Merge access preflight', () => {
      let editorID: number | string
      let restrictedID: number | string
      let allowedID: number | string
      let deniedID: number | string
      let localizedID: number | string
      let nestedID: number | string
      let publicID: number | string

      test.beforeEach(async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Access work', slug: 'accesswork' },
        })

        const editor = await payload.create({
          collection: 'users',
          data: { email: 'editor@example.com', password: 'test' },
        })
        editorID = editor.id

        const restricted = await payload.create({
          collection: restrictedSlug,
          data: { title: 'restricted on main' },
        })
        restrictedID = restricted.id

        const allowed = await payload.create({
          collection: whereAccessSlug,
          data: { mergeable: true, title: 'allowed on main' },
        })
        allowedID = allowed.id

        const denied = await payload.create({
          collection: whereAccessSlug,
          data: { mergeable: false, title: 'denied on main' },
        })
        deniedID = denied.id

        const nested = await payload.create({
          collection: nestedSlug,
          data: { items: [{ label: 'protected on main' }], title: 'nested on main' },
        })
        nestedID = nested.id

        const localized = await payload.create({
          collection: localizedSlug,
          data: { _status: 'published', title: 'localized on main' },
          locale: 'en',
        })
        localizedID = localized.id

        await payload.update({
          id: localizedID,
          collection: localizedSlug,
          data: { _status: 'published', title: 'localized Spanish on main' },
          locale: 'es',
        })

        const publicDoc = await payload.create({
          collection: publicSlug,
          data: { _status: 'draft', title: 'draft on main' },
          draft: true,
        })
        publicID = publicDoc.id

        for (const [collection, id] of [
          [restrictedSlug, restrictedID],
          [whereAccessSlug, allowedID],
          [whereAccessSlug, deniedID],
        ] as const) {
          await payload.update({
            id,
            branch: 'accesswork',
            collection,
            data: { title: 'edited on branch' },
          })
        }

        await payload.update({
          id: nestedID,
          branch: 'accesswork',
          collection: nestedSlug,
          data: { items: [{ label: 'protected on branch' }] },
        })

        await payload.update({
          id: localizedID,
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'blocked localized proposed data' },
          locale: 'es',
        })

        await payload.update({
          id: publicID,
          branch: 'accesswork',
          collection: publicSlug,
          data: { _status: 'published', title: 'published on branch' },
        })

        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: false,
          data: { navLabel: 'global main allowed' },
        })

        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: 'accesswork',
          data: { navLabel: 'blocked by proposed data' },
        })
      })

      test.afterEach(async () => {
        hookSpy.allowRestrictedCreate = undefined
        hookSpy.allowRestrictedLocalizedCreate = undefined
        hookSpy.allowRestrictedNestedFieldWrite = undefined
        hookSpy.beforeMerge = undefined
        hookSpy.localizedChangeOperations = undefined
        hookSpy.localizedCreateAccessTitles = undefined
        hookSpy.restrictLocalizedReadSelect = undefined
        hookSpy.restrictedCreateAccessResults = undefined

        for (const slug of [
          localizedSlug,
          nestedSlug,
          pagesSlug,
          publicSlug,
          restrictedSlug,
          whereAccessSlug,
        ]) {
          const rows = await payload.find({ branch: false, collection: slug, pagination: false })

          for (const row of rows.docs) {
            await payload.delete({ id: row.id, branch: false, collection: slug })
          }
        }

        await payload.delete({ id: editorID, collection: 'users' })

        if (payload.db.deleteBranchGlobal) {
          await payload.db.deleteBranchGlobal({
            branch: 'accesswork',
            globalSlug: headerGlobalSlug,
            req: await createPayloadRequest({ branch: false, payload }),
          })
        }

        for (const collection of [branchChangesSlug, branchesSlug]) {
          const rows = await payload.find({
            collection,
            pagination: false,
            where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'accesswork' } },
          })

          for (const row of rows.docs) {
            await payload.delete({ id: row.id, collection })
          }
        }
      })

      const asEditor = async () =>
        (
          await payload.find({
            collection: 'users',
            pagination: false,
            where: { id: { equals: editorID } },
          })
        ).docs[0]

      test('should evaluate collection access against the exact proposed data', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const blocked = result.blocked.find((each) => String(each.docID) === String(restrictedID))

        expect(blocked).toBeDefined()
        expect(blocked!.operation).toBe('update')
        expect(blocked!.reason).toBe('access')
        expect(blocked!.collectionSlug).toBe(restrictedSlug)
        expect(blocked!.message).toContain(restrictedSlug)
      })

      test('should evaluate collection access against each localized proposed write', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: localizedSlug,
            docID: localizedID,
            operation: 'publish',
          }),
        )
      })

      test('should evaluate create access against each localized proposed value', async () => {
        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed localized create' },
          locale: 'en',
        })

        await payload.update({
          id: created.id,
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'blocked localized create' },
          locale: 'es',
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: localizedSlug,
            docID: created.id,
            operation: 'create',
          }),
        )
      })

      test('should evaluate a latest draft against the current main state', async () => {
        const page = await payload.create({
          collection: pagesSlug,
          data: { _status: 'published', title: 'original sequential state' },
        })

        await payload.update({
          id: page.id,
          branch: 'accesswork',
          collection: pagesSlug,
          data: { _status: 'published', title: 'published before draft' },
        })

        await payload.update({
          id: page.id,
          branch: 'accesswork',
          collection: pagesSlug,
          data: { title: 'draft after allowed publish' },
          draft: true,
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: pagesSlug,
            docID: page.id,
            operation: 'update',
          }),
        )
      })

      test('should not evaluate sequential access against branch bookkeeping', async () => {
        const page = await payload.create({
          collection: pagesSlug,
          data: { _status: 'published', title: 'original branch bookkeeping state' },
        })

        await payload.update({
          id: page.id,
          branch: 'accesswork',
          collection: pagesSlug,
          data: { _status: 'published', title: 'published before restricted draft' },
        })

        await payload.update({
          id: page.id,
          branch: 'accesswork',
          collection: pagesSlug,
          data: { title: 'draft allowed only off main' },
          draft: true,
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: pagesSlug,
            docID: page.id,
            operation: 'update',
          }),
        )
      })

      test('should block a change to a protected nested field', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const blocked = result.blocked.find(
          (each) => each.collectionSlug === nestedSlug && String(each.docID) === String(nestedID),
        )

        expect(blocked).toMatchObject({
          collectionSlug: nestedSlug,
          operation: 'update',
          reason: 'access',
        })
      })

      test('should block a create containing a protected nested field', async () => {
        const created = await payload.create({
          branch: 'accesswork',
          collection: nestedSlug,
          data: { items: [{ label: 'protected branch create' }], title: 'created on branch' },
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: nestedSlug,
            docID: created.id,
            operation: 'create',
          }),
        )
      })

      test('should treat unmatched nested rows as new when checking protected fields', async () => {
        const nested = await payload.create({
          collection: nestedSlug,
          data: {
            items: [
              { label: 'protected first', note: 'first note' },
              { label: 'protected second', note: 'second note' },
            ],
            title: 'nested row identity',
          },
        })

        await payload.update({
          id: nested.id,
          branch: 'accesswork',
          collection: nestedSlug,
          data: {
            items: [
              { label: 'protected first', note: 'second note' },
              { label: 'protected second', note: 'first note' },
            ],
          },
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: nestedSlug,
            docID: nested.id,
            operation: 'update',
          }),
        )
      })

      test('should block a publication denied by _status field access', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const blocked = result.blocked.find(
          (each) => each.collectionSlug === publicSlug && String(each.docID) === String(publicID),
        )

        expect(blocked).toMatchObject({
          collectionSlug: publicSlug,
          operation: 'publish',
          reason: 'access',
        })
      })

      test('should not require publish access for a newer draft', async () => {
        await payload.update({
          id: publicID,
          branch: 'accesswork',
          collection: publicSlug,
          data: { title: 'drafted after denied publication' },
          draft: true,
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(
          result.blocked.filter(
            (each) => each.collectionSlug === publicSlug && String(each.docID) === String(publicID),
          ),
        ).toHaveLength(0)
      })

      test('should evaluate global access against the exact proposed data', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({ globalSlug: headerGlobalSlug, operation: 'update' }),
        )
      })

      test('should apply a global Where access result to the current main global', async () => {
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: false,
          data: { navLabel: 'global main denied' },
        })

        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: 'accesswork',
          data: { navLabel: 'allowed proposed data' },
        })

        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({ globalSlug: headerGlobalSlug, operation: 'update' }),
        )
      })

      test('should enforce merge access when overrideAccess is false', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const blockedIDs = result.blocked.map((each) => String(each.docID))

        expect(blockedIDs).toContain(String(restrictedID))
        expect(blockedIDs).toContain(String(deniedID))
        expect(blockedIDs).not.toContain(String(allowedID))
      })

      test('should allow the same document for a user who does have access', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
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

        expect(result.blocked.map((each) => String(each.docID))).not.toContain(String(restrictedID))
      })

      test('should resolve Where-returning access per document', async () => {
        const result = await payload.branches.merge({
          branch: 'accesswork',
          dryRun: true,
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const blockedIDs = result.blocked.map((each) => String(each.docID))

        expect(blockedIDs).toContain(String(deniedID))
        expect(blockedIDs).not.toContain(String(allowedID))
      })

      test('should leave all selected changes pending when one is blocked', async () => {
        const before = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'accesswork' } },
        })
        const result = await payload.branches.merge({
          branch: 'accesswork',
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const allowed = await payload.findByID({ id: allowedID, collection: whereAccessSlug })
        const restricted = await payload.findByID({ id: restrictedID, collection: restrictedSlug })
        const remaining = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'accesswork' } },
        })

        expect(result.canMerge).toBe(false)
        expect(result.merged).toHaveLength(0)
        expect(allowed.title).toBe('allowed on main')
        expect(restricted.title).toBe('restricted on main')
        expect(remaining.docs).toHaveLength(before.docs.length)
      })

      test('should merge a deliberately smaller permitted selection', async () => {
        const allowedChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: whereAccessSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(allowedID))

        expect(allowedChange).toBeDefined()

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [allowedChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })
        const allowed = await payload.findByID({ id: allowedID, collection: whereAccessSlug })
        const restricted = await payload.findByID({ id: restrictedID, collection: restrictedSlug })
        const pendingAllowedChange = await payload.findByID({
          id: allowedChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(result.merged).toContainEqual(
          expect.objectContaining({ collectionSlug: whereAccessSlug, docID: allowedID }),
        )
        expect(allowed.title).toBe('edited on branch')
        expect(restricted.title).toBe('restricted on main')
        expect(pendingAllowedChange).toBeNull()
      })

      test('should recheck Where access after beforeMerge changes main', async () => {
        const allowedChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: whereAccessSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(allowedID))

        expect(allowedChange).toBeDefined()

        hookSpy.beforeMerge = async ({ req }) => {
          await req.payload.update({
            id: allowedID,
            branch: false,
            collection: whereAccessSlug,
            data: { mergeable: false },
            overrideAccess: true,
            req,
          })
        }

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [allowedChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const onMain = await payload.findByID({ id: allowedID, collection: whereAccessSlug })
        const pending = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: {
            and: [
              { branch: { equals: 'accesswork' } },
              { collectionSlug: { equals: whereAccessSlug } },
            ],
          },
        })

        expect(onMain.title).toBe('allowed on main')
        expect(result.canMerge).toBe(false)
        expect(result.blocked).toContainEqual(
          expect.objectContaining({ collectionSlug: whereAccessSlug, docID: allowedID }),
        )
        expect(pending.docs.some((change) => String(change.doc?.value) === String(allowedID))).toBe(
          true,
        )
      })

      test('should abort rather than consume a change when field access changes before write', async () => {
        hookSpy.allowRestrictedNestedFieldWrite = true
        hookSpy.beforeMerge = () => {
          hookSpy.allowRestrictedNestedFieldWrite = false
        }

        const nestedChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: nestedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(nestedID))

        expect(nestedChange).toBeDefined()

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [nestedChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const onMain = await payload.findByID({ id: nestedID, collection: nestedSlug })
        const pending = await payload.findByID({
          id: nestedChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(onMain.items?.[0]?.label).toBe('protected on main')
        expect(result.canMerge).toBe(false)
        expect(result.blocked).toContainEqual(
          expect.objectContaining({ collectionSlug: nestedSlug, docID: nestedID }),
        )
        expect(pending).not.toBeNull()
      })

      test('should enforce create access when promoting a branch-created document', async () => {
        hookSpy.allowRestrictedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: pagesSlug,
          data: { _status: 'published', title: 'created on branch' },
        })
        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: pagesSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        hookSpy.restrictedCreateAccessResults = []

        hookSpy.beforeMerge = () => {
          hookSpy.allowRestrictedCreate = false
        }

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const onMain = await payload.find({
          collection: pagesSlug,
          pagination: false,
          where: { id: { equals: created.id } },
        })
        const pending = await payload.findByID({
          id: createdChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(onMain.docs).toHaveLength(0)
        expect(result.canMerge).toBe(false)
        expect(result.blocked).toContainEqual(
          expect.objectContaining({ collectionSlug: pagesSlug, docID: created.id }),
        )
        expect(pending).not.toBeNull()
        expect(hookSpy.restrictedCreateAccessResults).toContain(true)
        expect(hookSpy.restrictedCreateAccessResults?.at(-1)).toBe(false)
      })

      test('should recheck localized create access after beforeMerge', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed localized create' },
          locale: 'en',
        })

        await payload.update({
          id: created.id,
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'blocked localized create' },
          locale: 'es',
        })

        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        hookSpy.localizedCreateAccessTitles = []

        hookSpy.beforeMerge = () => {
          hookSpy.allowRestrictedLocalizedCreate = false
        }

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const pending = await payload.findByID({
          id: createdChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(result.canMerge).toBe(false)
        expect(result.blocked).toContainEqual(
          expect.objectContaining({ collectionSlug: localizedSlug, docID: created.id }),
        )
        expect(pending).not.toBeNull()
        expect(hookSpy.localizedCreateAccessTitles).toEqual([
          'allowed localized create',
          'blocked localized create',
          'allowed localized create',
          'blocked localized create',
        ])
      })

      test('should recheck localized create access after onProgress', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed localized create' },
          locale: 'en',
        })

        await payload.update({
          id: created.id,
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'blocked localized create' },
          locale: 'es',
        })

        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        await expect(
          payload.branches.merge({
            branch: 'accesswork',
            changes: [createdChange!.id],
            onProgress: () => {
              hookSpy.allowRestrictedLocalizedCreate = false
            },
            overrideAccess: false,
            user: (await asEditor()) as never,
          }),
        ).rejects.toThrow()

        const onMain = await payload.find({
          collection: localizedSlug,
          pagination: false,
          where: { id: { equals: created.id } },
        })
        const pending = await payload.findByID({
          id: createdChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(onMain.docs).toHaveLength(0)
        expect(pending).not.toBeNull()
      })

      test('should block a localized create containing a protected hidden field', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: {
            _status: 'published',
            restrictedHidden: 'protected branch value',
            title: 'allowed localized create',
          },
          locale: 'en',
        })
        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const onMain = await payload.find({
          collection: localizedSlug,
          pagination: false,
          where: { id: { equals: created.id } },
        })
        const pending = await payload.findByID({
          id: createdChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: localizedSlug,
            docID: created.id,
            operation: 'create',
          }),
        )
        expect(onMain.docs).toHaveLength(0)
        expect(pending).not.toBeNull()
      })

      test('should block a localized create containing a protected field excluded by select', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true
        hookSpy.restrictLocalizedReadSelect = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: {
            _status: 'published',
            restrictedSelectedOut: 'protected branch value',
            title: 'allowed localized create',
          },
          locale: 'en',
        })
        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        const result = await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(result.blocked).toContainEqual(
          expect.objectContaining({
            collectionSlug: localizedSlug,
            docID: created.id,
            operation: 'create',
          }),
        )
      })

      test('should preserve localized nested rows when promoting a branch-created document', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [{ label: 'first English' }, { label: 'second English' }],
            title: 'allowed localized create',
          },
          locale: 'en',
        })

        await payload.update({
          id: created.id,
          branch: 'accesswork',
          collection: localizedSlug,
          data: {
            _status: 'published',
            items: [
              { id: created.items?.[0]?.id, label: 'first Spanish' },
              { id: created.items?.[1]?.id, label: 'second Spanish' },
            ],
            title: 'allowed Spanish localized create',
          },
          locale: 'es',
        })

        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const mainEN = await payload.findByID({
          id: created.id,
          collection: localizedSlug,
          locale: 'en',
        })
        const mainES = await payload.findByID({
          id: created.id,
          collection: localizedSlug,
          locale: 'es',
        })

        expect(mainEN.items?.map((item) => item.label)).toEqual(['first English', 'second English'])
        expect(mainES.items?.map((item) => item.label)).toEqual(['first Spanish', 'second Spanish'])
        expect(mainEN.items?.map((item) => item.id)).toEqual(mainES.items?.map((item) => item.id))
      })

      test('should run the create lifecycle once when promoting multiple locales', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed localized create' },
          locale: 'en',
        })

        await payload.update({
          id: created.id,
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed Spanish localized create' },
          locale: 'es',
        })

        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        hookSpy.localizedChangeOperations = []

        await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        expect(
          hookSpy.localizedChangeOperations?.filter((operation) => operation === 'create'),
        ).toEqual(['create'])
      })

      test('should promote every locale of a permitted branch-created document', async () => {
        hookSpy.allowRestrictedLocalizedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed localized create' },
          locale: 'en',
        })

        await payload.update({
          id: created.id,
          branch: 'accesswork',
          collection: localizedSlug,
          data: { _status: 'published', title: 'allowed Spanish localized create' },
          locale: 'es',
        })

        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: localizedSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const mainEN = await payload.findByID({
          id: created.id,
          collection: localizedSlug,
          locale: 'en',
        })
        const mainES = await payload.findByID({
          id: created.id,
          collection: localizedSlug,
          locale: 'es',
        })

        expect(mainEN.title).toBe('allowed localized create')
        expect(mainES.title).toBe('allowed Spanish localized create')
      })

      test('should promote a permitted branch-created document with access checks', async () => {
        hookSpy.allowRestrictedCreate = true

        const created = await payload.create({
          branch: 'accesswork',
          collection: pagesSlug,
          data: { _status: 'published', title: 'permitted branch create' },
        })
        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: pagesSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const onMain = await payload.findByID({ id: created.id, collection: pagesSlug })

        expect(onMain.title).toBe('permitted branch create')
      })

      test('should not apply a create access Where result to the promoted row', async () => {
        const created = await payload.create({
          branch: 'accesswork',
          collection: pagesSlug,
          data: { _status: 'published', title: 'create access where result' },
        })
        const createdChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [
                { branch: { equals: 'accesswork' } },
                { collectionSlug: { equals: pagesSlug } },
              ],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(created.id))

        expect(createdChange).toBeDefined()

        await payload.branches.merge({
          branch: 'accesswork',
          changes: [createdChange!.id],
          overrideAccess: false,
          user: (await asEditor()) as never,
        })

        const onMain = await payload.findByID({ id: created.id, collection: pagesSlug })

        expect(onMain.title).toBe('create access where result')
      })

      test('should not mutate anything on a dryRun even when everything is permitted', async () => {
        await payload.branches.merge({ branch: 'accesswork', dryRun: true })

        const restricted = await payload.findByID({ id: restrictedID, collection: restrictedSlug })

        expect(restricted.title).toBe('restricted on main')
      })
    })
  },
)
