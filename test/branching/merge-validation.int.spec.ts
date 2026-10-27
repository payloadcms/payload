import type { MongooseAdapter } from '@payloadcms/db-mongodb'

import type { Payload, PayloadRequest } from 'payload'

import { Types } from 'mongoose'

import path from 'path'

import { createPayloadRequest, defaultBranchMergeValidation, resolveBranch } from 'payload'

import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { test } from '../__helpers/int/vitest.js'

import { devUser } from '../credentials.js'

import { hookSpy } from './hookSpy.js'

import { branchChangesSlug, branchesSlug, nestedSlug, pagesSlug, uniqueSlug } from './shared.js'

import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload

let restClient: NextRESTClient

let token: string

test.suite(
  'Branching: merge-validation',
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

    test.describe('Merge validation', () => {
      const branch = 'validation-work'
      let mainDocumentID: number | string

      const corruptBranchTitle = async () => {
        const req = await createPayloadRequest({ branch: false, payload })
        const shadow = await payload.db.findOne({
          branch: false,
          collection: pagesSlug,
          req,
          where: {
            and: [{ _branch: { equals: branch } }, { _branchDocID: { equals: mainDocumentID } }],
          },
        })

        await (payload.db as MongooseAdapter).collections[pagesSlug]!.collection.updateOne(
          { _id: new Types.ObjectId(String(shadow!.id)) },
          { $set: { title: { invalid: true } } },
        )
      }

      test.beforeEach(async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Validation work', slug: branch },
        })

        const mainDocument = await payload.create({
          collection: pagesSlug,
          data: { _status: 'published', title: 'main validation title' },
        })

        mainDocumentID = mainDocument.id

        await payload.update({
          id: mainDocumentID,
          branch,
          collection: pagesSlug,
          data: { _status: 'published', title: 'branch validation title' },
        })
      })

      test.afterEach(async () => {
        hookSpy.beforeMerge = undefined
        hookSpy.branchValidation = undefined
        hookSpy.pageBeforeOperation = undefined

        for (const collection of [pagesSlug, uniqueSlug]) {
          const rows = await payload.find({ branch: false, collection, pagination: false })

          for (const row of rows.docs) {
            await payload.delete({ id: row.id, branch: false, collection })
          }
        }

        for (const collection of [branchChangesSlug, branchesSlug]) {
          const rows = await payload.find({
            collection,
            pagination: false,
            where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: branch } },
          })

          for (const row of rows.docs) {
            await payload.delete({ id: row.id, collection })
          }
        }
      })

      test.options(
        'should reject malformed prepared content with the default validator',
        { db: 'mongo' },
        async () => {
          await corruptBranchTitle()

          const result = await payload.branches.merge({ branch, dryRun: true })
          const onMain = await payload.findByID({ id: mainDocumentID, collection: pagesSlug })

          expect(result.canMerge).toBe(false)
          expect(result.mergeable).toHaveLength(0)
          expect(result.validationErrors).toContainEqual(
            expect.objectContaining({
              collectionSlug: pagesSlug,
              docID: mainDocumentID,
              path: 'data.title',
            }),
          )
          expect(onMain.title).toBe('main validation title')
        },
      )

      test('should pass the latest candidate to replacement validation in main context', async () => {
        await payload.update({
          id: mainDocumentID,
          branch,
          collection: pagesSlug,
          data: { title: 'latest validation draft' },
          draft: true,
        })

        const calls: Parameters<NonNullable<typeof hookSpy.branchValidation>>[0][] = []

        hookSpy.branchValidation = (args) => {
          calls.push(args)

          return { errors: [], valid: true }
        }

        await payload.branches.merge({ branch, dryRun: true })

        expect(calls).toHaveLength(1)
        expect(calls[0]?.target).toBe('main')
        expect(resolveBranch(calls[0]!.req)).toBe('main')
        expect(calls[0]!.req.operation).toBe('validate')
        expect((calls[0]!.req.context as Record<string, unknown>)._branchBypass).toBeUndefined()
        expect(calls[0]?.candidates).toContainEqual(
          expect.objectContaining({
            collectionSlug: pagesSlug,
            data: expect.objectContaining({ title: 'latest validation draft' }),
            docID: mainDocumentID,
            draft: true,
            operation: 'update',
          }),
        )
      })

      test.options(
        'should let replacement validation replace only the precheck',
        { db: 'mongo' },
        async () => {
          await corruptBranchTitle()
          hookSpy.branchValidation = () => ({ errors: [], valid: true })

          const preview = await payload.branches.merge({ branch, dryRun: true })

          expect(preview.canMerge).toBe(true)
          expect(preview.validationErrors).toHaveLength(0)

          await expect(payload.branches.merge({ branch })).rejects.toThrow()

          const onMain = await payload.findByID({ id: mainDocumentID, collection: pagesSlug })

          expect(onMain.title).toBe('main validation title')
        },
      )

      test('should recheck replacement validation after beforeMerge changes policy', async () => {
        let validationCalls = 0

        hookSpy.branchValidation = () => {
          validationCalls += 1

          return {
            errors: [],
            valid: true,
          }
        }
        hookSpy.beforeMerge = () => {
          hookSpy.branchValidation = ({ candidates }) => ({
            errors: [
              {
                changeID: candidates[0]!.changeID,
                collectionSlug: candidates[0]!.collectionSlug,
                docID: candidates[0]!.docID,
                message: 'Policy changed before execution.',
              },
            ],
            valid: false,
          })
        }

        const result = await payload.branches.merge({ branch })
        const onMain = await payload.findByID({ id: mainDocumentID, collection: pagesSlug })

        expect(validationCalls).toBe(1)
        expect(result.canMerge).toBe(false)
        expect(result.validationErrors).toContainEqual(
          expect.objectContaining({ message: 'Policy changed before execution.' }),
        )
        expect(onMain.title).toBe('main validation title')
      })

      test('should propagate a replacement validation exception', async () => {
        hookSpy.branchValidation = () => {
          throw new Error('Replacement validation failed unexpectedly.')
        }

        await expect(payload.branches.merge({ branch, dryRun: true })).rejects.toThrow(
          'Replacement validation failed unexpectedly.',
        )
      })

      test('should validate known JSON, array, and block structures', async () => {
        const req = await createPayloadRequest({ branch: false, payload })
        const result = await defaultBranchMergeValidation({
          branch,
          candidates: [
            {
              changeID: 'structured-candidate',
              collectionSlug: nestedSlug,
              data: {
                items: { invalid: true },
                layout: [{ blockType: 'hero', heading: 42 }],
                metadata: { score: 'high' },
                unstructuredMetadata: { arbitrary: ['content', 42] },
              },
              docID: mainDocumentID,
              draft: false,
              entityType: 'collection',
              operation: 'update',
            },
          ],
          req,
          target: 'main',
        })

        expect(result.valid).toBe(false)
        expect(result.errors.map(({ path }) => path)).toEqual(
          expect.arrayContaining(['data.items', 'data.layout[0].heading', 'data.metadata.score']),
        )
        expect(
          result.errors.some(({ path }) => path?.startsWith('data.unstructuredMetadata')),
        ).toBe(false)
      })

      test('should preserve the caller request and skip merge hooks during preview', async () => {
        const req = await createPayloadRequest({ branch, payload })
        const initialContext = req.context
        const initialTransactionID = req.transactionID
        const beforeMerge = vi.fn()

        hookSpy.beforeMerge = beforeMerge

        await payload.branches.merge({ branch, dryRun: true, req })

        expect(beforeMerge).not.toHaveBeenCalled()
        expect(req.context).toBe(initialContext)
        expect(req.transactionID).toBe(initialTransactionID)
        expect(resolveBranch(req)).toBe(branch)
      })

      test('should reject writes made with the validation request', async () => {
        hookSpy.branchValidation = async ({ req }) => {
          await payload.update({
            id: mainDocumentID,
            collection: pagesSlug,
            data: { title: 'validation side effect' },
            req,
          })

          return { errors: [], valid: true }
        }

        await expect(payload.branches.merge({ branch, dryRun: true })).rejects.toThrow(
          'Content cannot be changed during branch merge validation.',
        )

        const onMain = await payload.findByID({ id: mainDocumentID, collection: pagesSlug })

        expect(onMain.title).toBe('main validation title')
      })

      test('should let the database reject a conflict after preview succeeds', async () => {
        const mainUnique = await payload.create({
          collection: uniqueSlug,
          data: { slug: 'merge-conflict' },
        })
        const branchUnique = await payload.create({
          branch,
          collection: uniqueSlug,
          data: { slug: 'merge-conflict' },
        })
        const branchUniqueChange = (
          await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: {
              and: [{ branch: { equals: branch } }, { collectionSlug: { equals: uniqueSlug } }],
            },
          })
        ).docs.find((change) => String(change.doc?.value) === String(branchUnique.id))

        expect(branchUniqueChange).toBeDefined()

        const preview = await payload.branches.merge({
          branch,
          changes: [branchUniqueChange!.id],
          dryRun: true,
        })

        expect(preview.canMerge).toBe(true)
        await expect(
          payload.branches.merge({ branch, changes: [branchUniqueChange!.id] }),
        ).rejects.toThrow()

        const mainRows = await payload.find({
          collection: uniqueSlug,
          pagination: false,
          where: { slug: { equals: 'merge-conflict' } },
        })
        const pendingChange = await payload.findByID({
          id: branchUniqueChange!.id,
          collection: branchChangesSlug,
          disableErrors: true,
        })

        expect(mainRows.docs.map(({ id }) => String(id))).toEqual([String(mainUnique.id)])
        expect(pendingChange).not.toBeNull()
      })

      test('should run target content hooks in main context', async () => {
        const hookRequests: PayloadRequest[] = []
        const branchReq = await createPayloadRequest({ branch, payload })

        hookSpy.pageBeforeOperation = ({ req }) => {
          hookRequests.push(req)
        }

        await payload.branches.merge({ branch, req: branchReq })

        expect(hookRequests.length).toBeGreaterThan(0)
        expect(hookRequests.every((req) => resolveBranch(req) === 'main')).toBe(true)
        expect(
          hookRequests.every(
            (req) => (req.context as Record<string, unknown>)._branchBypass === undefined,
          ),
        ).toBe(true)
        expect(resolveBranch(branchReq)).toBe(branch)
      })
    })
  },
)
