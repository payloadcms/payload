/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import type { Payload, PayloadRequest, SanitizedCollectionConfig } from 'payload'

import { Types } from 'mongoose'
import path from 'path'
import {
  assertBranchReadable,
  commitTransaction,
  createDataloaderCacheKey,
  createPayloadRequest,
  defaultBranchMergeValidation,
  initTransaction,
  isolateBranchState,
  isolateObjectProperty,
  killTransaction,
  resolveBranch,
  resolveEffectiveOperations,
} from 'payload'
import { fileURLToPath } from 'url'
import { expect, vi } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'

import { migrateBranching } from '../../packages/db-mongodb/src/predefinedMigrations/migrateBranching.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercises this internal boundary directly.
import { readLocalizedBranchWrite } from '../../packages/payload/src/branching/readLocalizedBranchWrite.js'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercises this internal boundary directly.
import { readCollectionMergeSnapshot } from '../../packages/payload/src/branching/readMergeSnapshot.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercises this internal boundary directly.
import { scheduleMergeHandler } from '../../packages/ui/src/utilities/scheduleMergeHandler.js'
import { test } from '../__helpers/int/vitest.js'
import { databaseAdapterSupportsTransactions } from '../__helpers/shared/databaseAdapterCapabilities.js'
import { mongooseList } from '../__helpers/shared/isMongoose.js'
import { devUser } from '../credentials.js'
import { hookSpy } from './hookSpy.js'
import {
  autosaveSlug,
  branchChangesSlug,
  branchesSlug,
  branchMergesSlug,
  categoriesSlug,
  excludedSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  localizedSlug,
  maxVersionsSlug,
  mediaSlug,
  nestedSlug,
  numericIDSlug,
  pagesSlug,
  postsSlug,
  publicSlug,
  restrictedSlug,
  uninitializedGlobalSlug,
  uniqueSlug,
  whereAccessSlug,
} from './shared.js'
import { createTrustedPayload } from './trustedPayload.js'

let payload: Payload
let restClient: NextRESTClient
let token: string

type BranchMergeTestChange = {
  afterVersionID?: string
  applicationOutcome?: string
  beforeVersionID?: string
  cleanupError?: string
  cleanupOutcome?: string
  collectionSlug?: string
  error?: string
  globalSlug?: string
  operation?: string
  recoveryError?: string
  recoveryOutcome?: string
  sourceID?: string
  sourceRevision?: string
  sourceUpdatedAt?: string
  sourceVersionIDs?: string[]
}

type BranchMergeTestEvent = {
  changes: BranchMergeTestChange[]
  error?: null | string
  status: string
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const expectedConcurrentOperationAttemptCounts = databaseAdapterSupportsTransactions({
  adapter: process.env.PAYLOAD_DATABASE ?? 'mongodb',
})
  ? [[1, 2]]
  : [
      [1, 1],
      [1, 2],
    ]
const transactionCapableMongooseAdapters = new Set(
  mongooseList.filter((adapter) => databaseAdapterSupportsTransactions({ adapter })),
)

const fieldNames = (collection: SanitizedCollectionConfig): string[] =>
  collection.flattenedFields.map((field) => field.name)

const collectionConfig = (slug: string): SanitizedCollectionConfig =>
  payload.collections[slug]!.config

const createBranchRecord = ({ name, slug }: { name: string; slug: string }) =>
  payload.create({ collection: branchesSlug, data: { name, slug } })

const findBranchChanges = ({ branch }: { branch: string }) =>
  payload.find({
    collection: branchChangesSlug,
    pagination: false,
    where: { branch: { equals: branch } },
  })

const findBranchMergeEvent = async ({
  branch,
}: {
  branch: string
}): Promise<BranchMergeTestEvent> => {
  const mergeEvents = await payload.find({
    collection: branchMergesSlug,
    pagination: false,
    where: { branch: { equals: branch } },
  })

  expect(mergeEvents.docs).toHaveLength(1)

  return mergeEvents.docs[0] as unknown as BranchMergeTestEvent
}

test.suite('Branching', { config: './config.ts', resetBetweenTests: false }, () => {
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

  test.describe('Schema', () => {
    test('should inject branch fields into a branch-enabled collection', () => {
      const names = fieldNames(collectionConfig(postsSlug))

      expect(names).toContain('_branch')
      expect(names).toContain('_branchDocID')
      expect(names).not.toContain('_branchOp')
    })

    test('should enforce one collection change per branch and logical document', () => {
      const changesCollection = collectionConfig(branchChangesSlug)

      expect(fieldNames(changesCollection)).toContain('documentID')
      expect(changesCollection.indexes).toContainEqual({
        fields: ['branch', 'collectionSlug', 'documentID'],
        requireExists: ['collectionSlug', 'documentID'],
        unique: true,
      })
    })

    test('should reject a duplicate collection change identity', async () => {
      const branch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Unique collection change identity' },
        overrideAccess: true,
      })
      const document = await payload.create({
        collection: postsSlug,
        data: { title: 'unique change target' },
        overrideAccess: true,
      })
      const changeData = {
        branch: branch.slug,
        collectionSlug: postsSlug,
        doc: { relationTo: postsSlug, value: document.id },
        documentID: String(document.id),
        entityType: 'collection' as const,
        operation: 'update' as const,
      }
      const change = await payload.create({
        collection: branchChangesSlug,
        data: changeData,
        overrideAccess: true,
      })

      try {
        await expect(
          payload.create({
            collection: branchChangesSlug,
            data: changeData,
            overrideAccess: true,
          }),
        ).rejects.toThrow()
      } finally {
        await payload.delete({
          id: change.id,
          collection: branchChangesSlug,
          overrideAccess: true,
        })
        await payload.delete({ id: document.id, collection: postsSlug, overrideAccess: true })
        await payload.delete({ id: branch.id, collection: branchesSlug, overrideAccess: true })
      }
    })

    test('should not inject branch fields into a collection opted out with branching: false', () => {
      const names = fieldNames(collectionConfig(excludedSlug))

      expect(names).not.toContain('_branch')
      expect(names).not.toContain('_branchDocID')
      expect(names).not.toContain('_branchOp')
    })

    test('should not inject branch fields into auth collections by default', () => {
      const names = fieldNames(collectionConfig('users'))

      expect(names).not.toContain('_branch')
    })

    test('should not inject branch fields into built-in Payload collections by default', () => {
      const names = fieldNames(collectionConfig('payload-preferences'))

      expect(names).not.toContain('_branch')
    })

    test('should default _branch to the main sentinel rather than null', () => {
      const branchField = collectionConfig(postsSlug).flattenedFields.find(
        (field) => field.name === '_branch',
      )

      expect(branchField).toMatchObject({ type: 'text', defaultValue: 'main' })
    })

    test('should type _branchDocID as a self-referential relationship so it inherits the ID type', () => {
      const docIDField = collectionConfig(numericIDSlug).flattenedFields.find(
        (field) => field.name === '_branchDocID',
      )

      expect(docIDField).toMatchObject({ type: 'relationship', relationTo: numericIDSlug })
    })

    test('should rewrite a unique field into a branch-scoped compound index', () => {
      const config = collectionConfig(uniqueSlug)
      const slugField = config.flattenedFields.find((field) => field.name === 'slug')

      expect(slugField).toMatchObject({ unique: false })
      expect(config.sanitizedIndexes).toContainEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ path: 'slug' }),
            expect.objectContaining({ path: '_branch' }),
          ]),
          unique: true,
        }),
      )
      expect(config.indexes).toContainEqual({
        fields: ['site', 'customSlug', '_branch'],
        requireExists: ['site', 'customSlug'],
        unique: true,
      })
      expect(config.sanitizedIndexes).toContainEqual(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({ path: 'metadata.code' }),
            expect.objectContaining({ path: '_branch' }),
          ]),
          requireExists: ['metadata.code'],
          unique: true,
        }),
      )
    })

    test('should add branch scope to a custom upload filename index', () => {
      expect(collectionConfig(mediaSlug).upload.filenameCompoundIndex).toEqual([
        'filename',
        'alt',
        '_branch',
      ])
    })

    test.options(
      'should build one branch-scoped unique index for each localized value',
      { db: 'mongo' },
      () => {
        const indexes = (payload.db as MongooseAdapter).collections[
          uniqueSlug
        ].schema.indexes() as [Record<string, 1>, Record<string, unknown>][]

        expect(indexes).toContainEqual([
          { _branch: 1, 'localizedSlug.en': 1 },
          {
            partialFilterExpression: { 'localizedSlug.en': { $exists: true } },
            unique: true,
          },
        ])
        expect(indexes).toContainEqual([
          { _branch: 1, 'localizedSlug.es': 1 },
          {
            partialFilterExpression: { 'localizedSlug.es': { $exists: true } },
            unique: true,
          },
        ])
        expect(
          indexes.some(
            ([definition]) => 'localizedSlug.en' in definition && 'localizedSlug.es' in definition,
          ),
        ).toBe(false)
      },
    )
  })

  test.options.describe('Existing MongoDB data migration', { db: 'mongo' }, () => {
    test('should backfill main data and replace a stale unrestricted unique index', async () => {
      const adapter = payload.db as MongooseAdapter
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'legacy page' },
      })
      const unique = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'legacy-unique' },
      })

      await payload.updateGlobal({
        data: { heroTitle: 'legacy global' },
        slug: homepageGlobalSlug,
      })

      await adapter.collections[pagesSlug].updateOne({ _id: page.id }, { $unset: { _branch: 1 } })
      await adapter.versions[pagesSlug].updateMany({ parent: page.id }, { $unset: { _branch: 1 } })
      await adapter.globals.updateOne(
        { globalType: homepageGlobalSlug },
        { $set: { _branch: null } },
      )
      await adapter.versions[homepageGlobalSlug].updateMany(
        { 'version.heroTitle': 'legacy global' },
        { $set: { _branch: null } },
      )
      await adapter.collections[uniqueSlug].collection.createIndex(
        { slug: 1 },
        { name: 'legacy_slug_unique', sparse: true, unique: true },
      )

      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { slug: 'legacy-unique' },
        }),
      ).rejects.toThrow()

      await migrateBranching({ payload })

      const migratedPage = await adapter.collections[pagesSlug]
        .findById(page.id)
        .lean<Record<string, unknown>>()
      const migratedVersions = await adapter.versions[pagesSlug]
        .find({ parent: page.id })
        .lean<Record<string, unknown>[]>()
      const migratedGlobal = await adapter.globals
        .findOne({ globalType: homepageGlobalSlug })
        .lean<Record<string, unknown>>()
      const migratedGlobalVersions = await adapter.versions[homepageGlobalSlug]
        .find({ 'version.heroTitle': 'legacy global' })
        .lean<Record<string, unknown>[]>()

      expect(migratedPage?._branch).toBe('main')
      expect(migratedVersions.every((version) => version._branch === 'main')).toBe(true)
      expect(migratedGlobal?._branch).toBe('main')
      expect(migratedGlobalVersions.every((version) => version._branch === 'main')).toBe(true)

      const indexes = await adapter.collections[uniqueSlug].collection.indexes()

      expect(indexes.some((index) => index.name === 'legacy_slug_unique')).toBe(false)

      const onBranch = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { slug: 'legacy-unique' },
      })

      expect(onBranch.slug).toBe('legacy-unique')

      await payload.delete({ id: onBranch.id, branch: false, collection: uniqueSlug })
      await payload.delete({ id: unique.id, branch: false, collection: uniqueSlug })
      await payload.delete({ id: page.id, branch: false, collection: pagesSlug })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { collectionSlug: { equals: uniqueSlug } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should report a conflict before replacing indexes', async () => {
      const adapter = payload.db as MongooseAdapter
      const existing = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'migration-conflict' },
      })
      const legacy = await adapter.collections[uniqueSlug].collection.insertOne({
        slug: 'migration-conflict',
      })

      await expect(migrateBranching({ payload })).rejects.toThrow()

      const legacyAfterFailure = await adapter.collections[uniqueSlug].collection.findOne({
        _id: legacy.insertedId,
      })

      expect(legacyAfterFailure?._branch).toBeUndefined()

      await adapter.collections[uniqueSlug].collection.deleteOne({ _id: legacy.insertedId })
      await payload.delete({ id: existing.id, branch: false, collection: uniqueSlug })
    })
  })

  test.describe('Writes on main', () => {
    const createdIDs: (number | string)[] = []

    test.afterAll(async () => {
      for (const id of createdIDs) {
        await payload.delete({ id, collection: postsSlug })
      }
      createdIDs.length = 0
    })

    test('should stamp documents created without a branch as main', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })
      createdIDs.push(doc.id)

      const raw = await payload.db.findOne({
        collection: postsSlug,
        where: { id: { equals: doc.id } },
      })

      expect(raw?._branch).toBe('main')
    })

    test('should still enforce uniqueness within a branch after the index rewrite', async () => {
      const first = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'about' },
      })

      await expect(
        payload.create({ collection: uniqueSlug, data: { slug: 'about' } }),
      ).rejects.toThrow()

      await payload.delete({ id: first.id, collection: uniqueSlug })
    })

    test('should allow several documents without an optional unique value', async () => {
      const first = await payload.create({ collection: uniqueSlug, data: {} })
      const second = await payload.create({ collection: uniqueSlug, data: {} })

      expect(first.id).not.toBe(second.id)

      await payload.delete({ id: first.id, collection: uniqueSlug })
      await payload.delete({ id: second.id, collection: uniqueSlug })
    })
  })

  test.describe('Read path — documents created on a branch', () => {
    const mainIDs: (number | string)[] = []
    const branchIDs: (number | string)[] = []

    test.beforeAll(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Halloween', slug: 'halloween' },
      })
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Q4 Launch', slug: 'q4' },
      })

      for (let i = 0; i < 25; i++) {
        const doc = await payload.create({
          collection: postsSlug,
          data: { order: i, title: `main post ${i}` },
        })
        mainIDs.push(doc.id)
      }

      for (let i = 0; i < 5; i++) {
        const doc = await payload.create({
          branch: 'halloween',
          collection: postsSlug,
          data: { order: 100 + i, title: `halloween post ${i}` },
        })
        branchIDs.push(doc.id)
      }
    })

    test.afterAll(async () => {
      for (const id of [...mainIDs, ...branchIDs]) {
        await payload.delete({ id, branch: false, collection: postsSlug })
      }
      mainIDs.length = 0
      branchIDs.length = 0
    })

    test('should hide a document created on a branch from main', async () => {
      const result = await payload.find({ collection: postsSlug, pagination: false })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(25)
      for (const branchID of branchIDs) {
        expect(ids).not.toContain(branchID)
      }
    })

    test('should return a document created on a branch when reading that branch', async () => {
      const result = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        pagination: false,
      })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(30)
      for (const branchID of branchIDs) {
        expect(ids).toContain(branchID)
      }
    })

    test('should isolate two concurrent branches from each other', async () => {
      const result = await payload.find({
        branch: 'q4',
        collection: postsSlug,
        pagination: false,
      })
      const ids = result.docs.map((doc) => doc.id)

      expect(ids).toHaveLength(25)
      for (const branchID of branchIDs) {
        expect(ids).not.toContain(branchID)
      }
    })

    /**
     * The load-bearing test for the whole design. If the branch predicate were
     * applied after the query rather than inside it, totalDocs and page
     * boundaries would both be wrong and no post-processing could fix them.
     */
    test('should keep pagination and totalDocs correct on main', async () => {
      const page1 = await payload.find({ collection: postsSlug, limit: 10, page: 1 })

      expect(page1.totalDocs).toBe(25)
      expect(page1.totalPages).toBe(3)
      expect(page1.docs).toHaveLength(10)
    })

    test('should keep pagination and totalDocs correct on a branch', async () => {
      const page1 = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        limit: 10,
        page: 1,
      })

      expect(page1.totalDocs).toBe(30)
      expect(page1.totalPages).toBe(3)
      expect(page1.docs).toHaveLength(10)
    })

    test('should not return the same document on two pages of a branch read', async () => {
      const seen = new Set<number | string>()

      for (const page of [1, 2, 3]) {
        const result = await payload.find({
          branch: 'halloween',
          collection: postsSlug,
          limit: 10,
          page,
          sort: 'order',
        })

        for (const doc of result.docs) {
          expect(seen.has(doc.id)).toBe(false)
          seen.add(doc.id)
        }
      }

      expect(seen.size).toBe(30)
    })

    test('should agree between count and find on a branch', async () => {
      const counted = await payload.count({ branch: 'halloween', collection: postsSlug })
      const found = await payload.find({
        branch: 'halloween',
        collection: postsSlug,
        pagination: false,
      })

      expect(counted.totalDocs).toBe(found.docs.length)
      expect(counted.totalDocs).toBe(30)
    })

    test('should record branch-created documents in the changeset registry', async () => {
      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'halloween' } },
      })

      expect(changes.docs).toHaveLength(5)
      expect(changes.docs[0]).toMatchObject({
        collectionSlug: postsSlug,
        documentID: String(changes.docs[0]!.doc?.value),
        entityType: 'collection',
        operation: 'create',
      })
    })

    test('should leave a branching-disabled collection unaffected by branch context', async () => {
      const doc = await payload.create({
        branch: 'halloween',
        collection: excludedSlug,
        data: { title: 'excluded' },
      })

      const fromMain = await payload.find({ collection: excludedSlug, pagination: false })

      expect(fromMain.docs.map((each) => each.id)).toContain(doc.id)

      await payload.delete({ id: doc.id, collection: excludedSlug })
    })

    test.todo('should leave query shapes unchanged when branching is disabled')
  })

  test.describe('Branch resolution', () => {
    test.todo(
      'should resolve the branch identically via Local API arg, query param and stored preference',
    )
    test.todo('should always resolve req.user from main, even on a branch')
  })

  /**
   * The gaps a coverage audit turned up: behaviours that are implemented and load-bearing
   * but were never asserted, so a regression in any of them would have been silent.
   */
  test.describe('Audit gaps', () => {
    const branch = 'auditwork'

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Audit work', slug: branch },
        })
      }
    })

    test.afterEach(async () => {
      for (const collection of [postsSlug, pagesSlug, categoriesSlug] as const) {
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

    // `withBranchVersionSelect` is the version-side twin of the collection guard: an
    // include-mode `select` narrows a row to exactly the fields named, which would drop
    // the injected columns the branch predicate and the canonical-ID projection depend
    // on. The three existing select tests all run against a collection with versions
    // off, so this guard was never exercised — and its failure mode is shadow-row
    // primary keys surfacing as document IDs in the admin drafts list.
    test('should keep canonical IDs when selecting fields on a branch drafts read', async () => {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'main title' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: pagesSlug,
        data: { title: 'branch title' },
        draft: true,
      })

      const drafts = await payload.find({
        branch,
        collection: pagesSlug,
        draft: true,
        pagination: false,
        select: { title: true },
        where: { id: { equals: doc.id } },
      })

      expect(drafts.docs).toHaveLength(1)
      expect(String(drafts.docs[0]!.id)).toBe(String(doc.id))
      expect(drafts.docs[0]!.title).toBe('branch title')
    })

    test('should keep canonical IDs when selecting fields on a branch version read', async () => {
      const doc = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'main title' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: pagesSlug,
        data: { _status: 'published', title: 'branch title' },
      })

      const versions = await payload.findVersions({
        branch,
        collection: pagesSlug,
        pagination: false,
        select: { parent: true, version: true },
        where: { parent: { equals: doc.id } },
      })

      // Every row reports the canonical parent, not the shadow row it hangs off.
      expect(versions.docs.length).toBeGreaterThan(0)

      for (const version of versions.docs) {
        expect(String(version.parent)).toBe(String(doc.id))
      }
    })

    // The bulk paths are what the admin list view's "edit many" and "delete many" use.
    test('should fork every matching document on a bulk update', async () => {
      const first = await payload.create({ collection: postsSlug, data: { title: 'first' } })
      const second = await payload.create({ collection: postsSlug, data: { title: 'second' } })

      await payload.update({
        branch,
        collection: postsSlug,
        data: { title: 'bulk edited' },
        where: { id: { in: [first.id, second.id] } },
      })

      const onBranch = await payload.find({ branch, collection: postsSlug, pagination: false })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs.map((doc) => doc.title).sort()).toEqual(['bulk edited', 'bulk edited'])
      expect(onMain.docs.map((doc) => doc.title).sort()).toEqual(['first', 'second'])
    })

    test('should tombstone every matching document on a bulk delete', async () => {
      const first = await payload.create({ collection: postsSlug, data: { title: 'first' } })
      const second = await payload.create({ collection: postsSlug, data: { title: 'second' } })

      await payload.delete({
        branch,
        collection: postsSlug,
        where: { id: { in: [first.id, second.id] } },
      })

      const onBranch = await payload.find({ branch, collection: postsSlug, pagination: false })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs).toHaveLength(0)
      expect(onMain.docs.map((doc) => doc.title).sort()).toEqual(['first', 'second'])
    })

    // The plan's own #1 risk. The merge-create promotion updates the shadow row in place
    // rather than recreating it *specifically* so inbound relationship rows survive —
    // deleting the row would cascade them away, and rebuilding it does not bring them
    // back. A regression here silently nulls relationships after a merge.
    test('should preserve inbound relationships when merging a branch-created document', async () => {
      const category = await payload.create({
        branch,
        collection: categoriesSlug,
        data: { name: 'branch category' },
      })

      const post = await payload.create({
        branch,
        collection: postsSlug,
        data: { category: category.id, title: 'points at branch category' },
      })

      const result = await payload.branches.merge({ branch })

      expect(result.blocked).toEqual([])
      expect(result.validationErrors).toEqual([])
      expect(result.merged).toHaveLength(2)

      const rawPost = await payload.db.findOne({
        branch: false,
        collection: postsSlug,
        req: await createPayloadRequest({ branch: false, payload }),
        where: { id: { equals: post.id } },
      })

      expect(rawPost).toMatchObject({ _branch: 'main' })

      const onMain = await payload.findByID({ id: post.id, collection: postsSlug, depth: 1 })
      const related = onMain.category as { id?: number | string; name?: string } | null

      // Populated, not a bare ID and not null: the relationship row survived the merge.
      expect(related).toBeTruthy()
      expect(typeof related).toBe('object')
      expect(related?.name).toBe('branch category')
    })

    // Plan §15's precedence contract. The general form of the bug this audit started
    // from: the Local API argument and the query param must resolve to the same branch,
    // or one entry point quietly reads production while the other reads the branch.
    test('should resolve the same branch from a Local API argument and a query param', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: postsSlug,
        data: { title: 'on branch' },
      })

      const viaArgument = await payload.findByID({ id: doc.id, branch, collection: postsSlug })

      const viaQueryParam = await restClient.GET(
        `/${postsSlug}/${doc.id}?branch=${branch}&depth=0`,
        {
          headers: { Authorization: `JWT ${token}` },
        },
      )

      expect(viaArgument.title).toBe('on branch')
      expect((await viaQueryParam.json()).title).toBe(viaArgument.title)
    })
  })

  /**
   * Two shapes the suite could not reach before: a localized field, which forks per
   * locale, and array/block fields, which live in their own tables under Drizzle so a
   * fork has to copy child rows and re-parent them.
   */
  test.describe('Localized and nested fields', () => {
    const branch = 'shapework'

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Shape work', slug: branch },
        })
      }
    })

    test.afterEach(async () => {
      hookSpy.localizedChangeRows = undefined
      hookSpy.postDefaultValueCount = undefined

      for (const collection of [localizedSlug, nestedSlug] as const) {
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

    test('should fork one locale and leave the others reading main', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: { _status: 'published', title: 'main english' },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        collection: localizedSlug,
        data: { _status: 'published', title: 'main spanish' },
        locale: 'es',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: { _status: 'published', title: 'branch spanish' },
        locale: 'es',
      })

      const branchES = await payload.findByID({
        id: doc.id,
        branch,
        collection: localizedSlug,
        locale: 'es',
      })
      const branchEN = await payload.findByID({
        id: doc.id,
        branch,
        collection: localizedSlug,
        locale: 'en',
      })
      const mainES = await payload.findByID({ id: doc.id, collection: localizedSlug, locale: 'es' })

      expect(branchES.title).toBe('branch spanish')
      // The untouched locale came along in the fork, so it still reads as main's.
      expect(branchEN.title).toBe('main english')
      expect(mainES.title).toBe('main spanish')
    })

    test('should merge a localized edit into the right locale only', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: { _status: 'published', title: 'main english' },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        collection: localizedSlug,
        data: { _status: 'published', title: 'main spanish' },
        locale: 'es',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: { _status: 'published', title: 'branch spanish' },
        locale: 'es',
      })

      await payload.branches.merge({ branch })

      const mainES = await payload.findByID({ id: doc.id, collection: localizedSlug, locale: 'es' })
      const mainEN = await payload.findByID({ id: doc.id, collection: localizedSlug, locale: 'en' })

      expect(mainES.title).toBe('branch spanish')
      expect(mainEN.title).toBe('main english')
    })

    test('should preserve one localized nested row across every merged locale', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [{ label: 'main English' }],
          title: 'main english',
        },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [{ id: doc.items?.[0]?.id, label: 'main Spanish' }],
          title: 'main spanish',
        },
        locale: 'es',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [{ label: 'branch English' }],
          title: 'branch english',
        },
        locale: 'en',
      })

      hookSpy.localizedChangeRows = []

      await payload.branches.merge({ branch })

      const mainEN = await payload.findByID({
        id: doc.id,
        collection: localizedSlug,
        locale: 'en',
      })
      const mainES = await payload.findByID({
        id: doc.id,
        collection: localizedSlug,
        locale: 'es',
      })

      expect(mainEN.items?.map((item) => item.label)).toEqual(['branch English'])
      expect(mainES.items?.map((item) => item.label)).toEqual(['main Spanish'])
      expect(mainEN.items?.map((item) => item.id)).toEqual(mainES.items?.map((item) => item.id))
      expect(hookSpy.localizedChangeRows).toHaveLength(2)
      expect(hookSpy.localizedChangeRows?.[0]?.ids).toEqual(hookSpy.localizedChangeRows?.[1]?.ids)
    })

    test('should preserve nested row identity when a later branch draft reorders rows', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [{ label: 'main row' }],
          title: 'main',
        },
        locale: 'en',
      })

      const publishedOnBranch = await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [{ label: 'first published' }, { label: 'second published' }],
          title: 'published on branch',
        },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: {
          items: [
            { id: publishedOnBranch.items?.[1]?.id, label: 'second draft' },
            { id: publishedOnBranch.items?.[0]?.id, label: 'first draft' },
          ],
          title: 'draft on branch',
        },
        draft: true,
        locale: 'en',
      })

      await payload.branches.merge({ branch })

      const publishedOnMain = await payload.findByID({
        id: doc.id,
        collection: localizedSlug,
        locale: 'en',
      })
      const draftOnMain = await payload.findByID({
        id: doc.id,
        collection: localizedSlug,
        draft: true,
        locale: 'en',
      })

      expect(draftOnMain.items?.map((item) => item.label)).toEqual(['second draft', 'first draft'])
      expect(publishedOnMain.items?.map((item) => item.label)).toEqual(['main row'])
      expect(draftOnMain.items?.map((item) => item.id)).toHaveLength(2)
      expect(draftOnMain.items?.every((item) => Boolean(item.id))).toBe(true)
      expect(draftOnMain.items?.map((item) => item.id)).not.toContain(
        publishedOnMain.items?.[0]?.id,
      )
    })

    test('should preserve nested row identity when a later branch draft removes a row', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [{ label: 'main row' }],
          title: 'main',
        },
        locale: 'en',
      })

      const publishedOnBranch = await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: {
          _status: 'published',
          items: [
            { label: 'first published' },
            { label: 'second published' },
            { label: 'third published' },
          ],
          title: 'published on branch',
        },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: {
          items: [
            { id: publishedOnBranch.items?.[1]?.id, label: 'second draft' },
            { id: publishedOnBranch.items?.[2]?.id, label: 'third draft' },
          ],
          title: 'draft on branch',
        },
        draft: true,
        locale: 'en',
      })

      await payload.branches.merge({ branch })

      const publishedOnMain = await payload.findByID({
        id: doc.id,
        collection: localizedSlug,
        locale: 'en',
      })
      const draftOnMain = await payload.findByID({
        id: doc.id,
        collection: localizedSlug,
        draft: true,
        locale: 'en',
      })

      expect(draftOnMain.items?.map((item) => item.label)).toEqual(['second draft', 'third draft'])
      expect(publishedOnMain.items?.map((item) => item.label)).toEqual(['main row'])
      expect(draftOnMain.items?.map((item) => item.id)).toHaveLength(2)
      expect(draftOnMain.items?.every((item) => Boolean(item.id))).toBe(true)
      expect(draftOnMain.items?.map((item) => item.id)).not.toContain(
        publishedOnMain.items?.[0]?.id,
      )
    })

    test('should read exact localized merge data without evaluating defaults', async () => {
      const doc = await payload.create({
        collection: localizedSlug,
        data: { _status: 'published', title: 'main english' },
        locale: 'en',
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: localizedSlug,
        data: { _status: 'published', title: 'branch english' },
        locale: 'en',
      })

      hookSpy.postDefaultValueCount = 0

      const branchWrite = await readLocalizedBranchWrite({
        branch,
        collectionSlug: localizedSlug,
        docID: doc.id,
        draft: false,
        locale: 'en',
        payload,
        req: await createPayloadRequest({ branch: false, payload }),
      })

      expect(hookSpy.postDefaultValueCount).toBe(0)
      expect(branchWrite?.computedDefault).toBeUndefined()
    })

    test('should fork array and block rows onto the branch', async () => {
      const doc = await payload.create({
        collection: nestedSlug,
        data: {
          items: [{ label: 'main one' }, { label: 'main two' }],
          layout: [{ blockType: 'hero', heading: 'main hero' }],
          title: 'nested on main',
        },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: nestedSlug,
        data: {
          items: [{ label: 'branch one' }],
          layout: [{ blockType: 'hero', heading: 'branch hero' }],
          title: 'nested on branch',
        },
      })

      const onBranch = await payload.findByID({ id: doc.id, branch, collection: nestedSlug })
      const onMain = await payload.findByID({ id: doc.id, collection: nestedSlug })

      // Child rows belong to the copy that owns them: replacing them on the branch must
      // not take main's with it, which is the failure a flat-field test cannot see.
      expect(onBranch.items).toHaveLength(1)
      expect(onBranch.items?.[0]?.label).toBe('branch one')
      expect((onBranch.layout?.[0] as { heading?: string })?.heading).toBe('branch hero')

      expect(onMain.items).toHaveLength(2)
      expect(onMain.items?.map((item) => item.label)).toEqual(['main one', 'main two'])
      expect((onMain.layout?.[0] as { heading?: string })?.heading).toBe('main hero')
    })

    test('should merge array and block rows into main', async () => {
      const doc = await payload.create({
        collection: nestedSlug,
        data: {
          items: [{ label: 'main one' }, { label: 'main two' }],
          layout: [{ blockType: 'hero', heading: 'main hero' }],
          title: 'nested on main',
        },
      })

      await payload.update({
        id: doc.id,
        branch,
        collection: nestedSlug,
        data: {
          items: [{ label: 'branch one' }],
          layout: [{ blockType: 'hero', heading: 'branch hero' }],
          title: 'nested on branch',
        },
      })

      await payload.branches.merge({ branch })

      const onMain = await payload.findByID({ id: doc.id, collection: nestedSlug })

      expect(onMain.title).toBe('nested on branch')
      expect(onMain.items).toHaveLength(1)
      expect(onMain.items?.[0]?.label).toBe('branch one')
      expect((onMain.layout?.[0] as { heading?: string })?.heading).toBe('branch hero')
    })
  })

  /**
   * §15's precedence contract, at the point it is easiest to get wrong: an operation handed
   * both a request and a branch. The branch is an argument, so the argument wins — the same
   * contract `locale` has.
   */
  test.describe('An explicit branch on a shared request', () => {
    const first = 'explicitfirst'
    const second = 'explicitsecond'
    let docID: number | string

    test.beforeAll(async () => {
      for (const slug of [first, second]) {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })

        if (!existing.docs.length) {
          await payload.create({ collection: branchesSlug, data: { name: slug, slug } })
        }
      }
    })

    test.beforeEach(async () => {
      const doc = await payload.create({ collection: postsSlug, data: { title: 'on main' } })

      docID = doc.id

      for (const [slug, title] of [
        [first, 'on first branch'],
        [second, 'on second branch'],
      ] as const) {
        await payload.update({ id: docID, branch: slug, collection: postsSlug, data: { title } })
      }
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { in: [first, second] } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    test('should read each branch a request is pointed at, in turn', async () => {
      const req = await createPayloadRequest({ payload })

      // The first read resolves and memoizes a branch on this request; the second and third
      // name different ones, and used to be handed the first one's answer.
      const onFirst = await payload.findByID({
        id: docID,
        branch: first,
        collection: postsSlug,
        req,
      })
      const onSecond = await payload.findByID({
        id: docID,
        branch: second,
        collection: postsSlug,
        req,
      })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(onFirst.title).toBe('on first branch')
      expect(onSecond.title).toBe('on second branch')
      // No branch named, so this one takes the request as it finds it.
      expect(onMain.title).toBe('on first branch')
    })

    test('should leave the caller request on its own branch', async () => {
      const req = await createPayloadRequest({ branch: first, payload })

      await payload.findByID({ id: docID, branch: second, collection: postsSlug, req })

      // The operation ran somewhere else; this request is where it was.
      const after = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(after.title).toBe('on first branch')
    })

    test('should write to the branch it is told to, not the one the request resolved', async () => {
      const req = await createPayloadRequest({ branch: first, payload })

      await payload.findByID({ id: docID, collection: postsSlug, req })

      await payload.update({
        id: docID,
        branch: second,
        collection: postsSlug,
        data: { title: 'written to second' },
        req,
      })

      const onSecond = await payload.findByID({ id: docID, branch: second, collection: postsSlug })
      const onFirst = await payload.findByID({ id: docID, branch: first, collection: postsSlug })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onSecond.title).toBe('written to second')
      expect(onFirst.title).toBe('on first branch')
      expect(onMain.title).toBe('on main')
    })

    test('should bypass branching when told to, on a branch-scoped request', async () => {
      const req = await createPayloadRequest({ branch: first, payload })

      await payload.findByID({ id: docID, collection: postsSlug, req })

      // `branch: false` is the same contract pointed at production — what merge relies on.
      const onMain = await payload.findByID({
        id: docID,
        branch: false,
        collection: postsSlug,
        req,
      })

      expect(onMain.title).toBe('on main')
    })
  })

  /**
   * Depth-populated relationships. The dataloader batches population and caches by a key
   * that did not include the branch, so a document ID could resolve to the wrong branch's
   * copy — and the population read itself has to carry the branch to find a related
   * document that only exists on it.
   */
  test.describe('Populated relationships on a branch', () => {
    const branch = 'populatework'
    const other = 'populateother'

    test.beforeAll(async () => {
      for (const slug of [branch, other]) {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })

        if (!existing.docs.length) {
          await payload.create({
            collection: branchesSlug,
            data: { name: slug, slug },
          })
        }
      }
    })

    test.afterEach(async () => {
      for (const collection of [postsSlug, categoriesSlug, numericIDSlug] as const) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection }).catch(() => {})
        }
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { in: [branch, other] } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    test('should populate a related document that exists only on the branch', async () => {
      const category = await payload.create({
        branch,
        collection: categoriesSlug,
        data: { name: 'branch only category' },
      })

      const post = await payload.create({
        branch,
        collection: postsSlug,
        data: { category: category.id, title: 'points at branch-only category' },
      })

      const onBranch = await payload.findByID({
        id: post.id,
        branch,
        collection: postsSlug,
        depth: 1,
      })

      // Populated, not left as a bare ID: the population read carried the branch, so it
      // could see a document main has never heard of.
      expect(typeof onBranch.category).toBe('object')
      expect((onBranch.category as { name?: string })?.name).toBe('branch only category')
    })

    test('should populate the branch copy of a document that also exists on main', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })

      await payload.update({
        id: category.id,
        branch,
        collection: categoriesSlug,
        data: { name: 'branch category' },
      })

      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'points at forked category' },
      })

      const onBranch = await payload.findByID({
        id: post.id,
        branch,
        collection: postsSlug,
        depth: 1,
      })
      const onMain = await payload.findByID({ id: post.id, collection: postsSlug, depth: 1 })

      expect((onBranch.category as { name?: string })?.name).toBe('branch category')
      expect((onMain.category as { name?: string })?.name).toBe('main category')
    })

    test.each([
      [
        'single',
        ({ categoryID, req }: { categoryID: number | string; req: PayloadRequest }) =>
          payload.update({
            id: categoryID,
            collection: categoriesSlug,
            data: { name: 'branch category' },
            req,
          }),
      ],
      [
        'bulk',
        ({ categoryID, req }: { categoryID: number | string; req: PayloadRequest }) =>
          payload.update({
            collection: categoriesSlug,
            data: { name: 'branch category' },
            req,
            where: { id: { equals: categoryID } },
          }),
      ],
    ] as const)(
      'should refresh populated relationships after a %s branch update on the same request',
      async (_operation, updateCategory) => {
        const category = await payload.create({
          collection: categoriesSlug,
          data: { name: 'main category' },
        })
        const post = await payload.create({
          collection: postsSlug,
          data: { category: category.id, title: 'points at updated category' },
        })
        const req = await createPayloadRequest({ branch, payload })
        const beforeUpdate = await payload.findByID({
          id: post.id,
          collection: postsSlug,
          depth: 1,
          req,
        })

        await updateCategory({ categoryID: category.id, req })

        const afterUpdate = await payload.findByID({
          id: post.id,
          collection: postsSlug,
          depth: 1,
          req,
        })

        expect((beforeUpdate.category as { name?: string })?.name).toBe('main category')
        expect((afterUpdate.category as { name?: string })?.name).toBe('branch category')
      },
    )

    test('should refresh populated relationships after a branch delete on the same request', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })
      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'points at deleted category' },
      })
      const req = await createPayloadRequest({ branch, payload })
      const beforeDelete = await payload.findByID({
        id: post.id,
        collection: postsSlug,
        depth: 1,
        req,
      })

      await payload.delete({ id: category.id, collection: categoriesSlug, req })

      const afterDelete = await payload.findByID({
        id: post.id,
        collection: postsSlug,
        depth: 1,
        req,
      })

      expect((beforeDelete.category as { name?: string })?.name).toBe('main category')
      expect(String(afterDelete.category)).toBe(String(category.id))
    })

    test('should refresh populated relationships after a branch create on the same request', async () => {
      const req = await createPayloadRequest({ branch, payload })
      const documentID = 9_812_345
      const cacheKey = createDataloaderCacheKey({
        branch,
        collectionSlug: numericIDSlug,
        currentDepth: 0,
        depth: 1,
        docID: documentID,
        draft: false,
        fallbackLocale: req.fallbackLocale!,
        locale: req.locale!,
        overrideAccess: true,
        showHiddenFields: false,
        transactionID: req.transactionID!,
      })
      const beforeCreate = await req.payloadDataLoader.load(cacheKey)

      await payload.create({
        collection: numericIDSlug,
        data: { id: documentID, title: 'created on branch' },
        req,
      })

      const afterCreate = await req.payloadDataLoader.load(cacheKey)

      expect(beforeCreate).toBeNull()
      expect(afterCreate).toMatchObject({ id: documentID, title: 'created on branch' })
    })

    test('should not serve one branch a populated document cached for another', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })

      for (const [slug, name] of [
        [branch, 'first branch category'],
        [other, 'second branch category'],
      ] as const) {
        await payload.update({
          id: category.id,
          branch: slug,
          collection: categoriesSlug,
          data: { name },
        })
      }

      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'read from two branches' },
      })

      // Two branch-scoped views of one request, each with its own branch state but sharing
      // the dataloader — which is exactly what a GraphQL request does, one field at a time.
      // A shared `req` on its own resolves a single branch by design (§15); this is the
      // shape that legitimately reads two, and the dataloader's cache key has to tell them
      // apart or the second field is served the first field's populated document.
      const base = await createPayloadRequest({ payload })

      const readOn = async (slug: string) => {
        const scoped = isolateObjectProperty(base, ['branch', 'context'])

        scoped.branch = slug
        scoped.context = {}

        return payload.findByID({
          id: post.id,
          collection: postsSlug,
          depth: 1,
          req: scoped,
        })
      }

      const first = await readOn(branch)
      const second = await readOn(other)

      expect((first.category as { name?: string })?.name).toBe('first branch category')
      expect((second.category as { name?: string })?.name).toBe('second branch category')
    })
  })

  /**
   * GraphQL had no branch mechanism at all — not an argument anywhere in the schema — so
   * the only way to reach a branch was a query param on the POST URL, which nothing used
   * and nothing tested. `branch` is now an argument, resolved onto the request the same way
   * `locale` is.
   */
  test.describe('GraphQL', () => {
    const branch = 'graphqlwork'
    let docID: number | string

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'GraphQL work', slug: branch },
        })
      }
    })

    test.beforeEach(async () => {
      const doc = await payload.create({ collection: postsSlug, data: { title: 'on main' } })

      docID = doc.id

      await payload.update({
        id: docID,
        branch,
        collection: postsSlug,
        data: { title: 'on branch' },
      })
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug }).catch(() => {})
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

    // Numeric-ID adapters need a bare ID, string-ID adapters a quoted one, and GraphQL
    // rejects the wrong form outright.
    const gqlID = (id: number | string) =>
      payload.db.defaultIDType === 'number' ? String(id) : `"${id}"`

    const gql = async (query: string) =>
      restClient
        .GRAPHQL_POST({
          body: JSON.stringify({ query }),
          headers: { Authorization: `JWT ${token}` },
        })
        .then((res) => res.json())

    test('should read a document on a branch', async () => {
      const onBranch = await gql(`query {
        Post(id: ${gqlID(docID)}, branch: "${branch}") { title }
      }`)

      const onMain = await gql(`query {
        Post(id: ${gqlID(docID)}) { title }
      }`)

      expect(onBranch.data.Post.title).toBe('on branch')
      expect(onMain.data.Post.title).toBe('on main')
    })

    test('should list documents on a branch', async () => {
      const result = await gql(`query {
        Posts(branch: "${branch}") { docs { id title } }
      }`)

      const matching = (result.data.Posts.docs as { id: string; title: string }[]).filter(
        (doc) => String(doc.id) === String(docID),
      )

      expect(matching).toHaveLength(1)
      expect(matching[0]!.title).toBe('on branch')
    })

    test('should fork onto the branch when updating through GraphQL', async () => {
      await gql(`mutation {
        updatePost(id: ${gqlID(docID)}, branch: "${branch}", data: { title: "written through graphql" }) {
          title
        }
      }`)

      const onBranch = await payload.findByID({ id: docID, branch, collection: postsSlug })
      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onBranch.title).toBe('written through graphql')
      expect(onMain.title).toBe('on main')
    })
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
      expect(event.changes[0]?.before).toBeUndefined()
      expect(event.changes[0]?.after).toBeUndefined()
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

  // `findDistinct` had no branch predicate in either adapter, so a branch's shadow rows
  // fed main's distinct values and the branch's own edits were missing from its own.
  test.describe('Distinct values on a branch', () => {
    const branch = 'distinctwork'
    const created: (number | string)[] = []

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: branch } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Distinct work', slug: branch },
        })
      }
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branch } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }

      created.length = 0
    })

    test('should reflect a branch edit and hide it from main', async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })

      created.push(doc.id)

      await payload.update({
        id: doc.id,
        branch,
        collection: postsSlug,
        data: { title: 'on branch' },
      })

      const onBranch = await payload.findDistinct({
        branch,
        collection: postsSlug,
        field: 'title',
      })
      const onMain = await payload.findDistinct({ collection: postsSlug, field: 'title' })

      const values = (result: { values: { title?: unknown }[] }) =>
        result.values.map((value) => value.title)

      // One value each, and not the same one: the branch sees its edit, main sees its own
      // document, and neither sees the other's row.
      expect(values(onBranch as never)).toEqual(['on branch'])
      expect(values(onMain as never)).toEqual(['on main'])
    })
  })

  /**
   * §12.5. The gate answers the one question a document's own access control cannot:
   * may this reader be looking at a proposal rather than production. Every case here
   * uses a collection whose read access is the canonical public-site rule, because a
   * branch's copy of a published document satisfies that rule too.
   */
  test.describe('Branch visibility', () => {
    let publicDocID: number | string
    const privateBranch = 'private-visibility'

    test.beforeAll(async () => {
      for (const branch of ['visibility', privateBranch]) {
        const existing = await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: branch } },
        })

        if (!existing.docs.length) {
          await payload.create({
            collection: branchesSlug,
            data: {
              name: branch === privateBranch ? 'Private visibility' : 'Visibility',
              slug: branch,
            },
          })
        }
      }
    })

    test.beforeEach(async () => {
      const doc = await payload.create({
        collection: publicSlug,
        data: { _status: 'published', title: 'live on main' },
      })

      publicDocID = doc.id

      await payload.update({
        id: doc.id,
        branch: 'visibility',
        collection: publicSlug,
        data: { _status: 'published', title: 'unreleased on branch' },
      })

      await payload.update({
        id: doc.id,
        branch: privateBranch,
        collection: publicSlug,
        data: { _status: 'published', title: 'private unreleased content' },
      })

      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main navigation' },
      })
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: publicSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: publicSlug }).catch(() => {})
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { in: ['visibility', privateBranch] } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug }).catch(() => {})
      }
    })

    test('should refuse an anonymous read that names a branch', async () => {
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=visibility`, {
        auth: false,
      })

      expect(res.status).toBe(403)
    })

    test('should still serve main to an anonymous reader', async () => {
      // The gate must not cost anything to a request that never mentions a branch —
      // the public site is this request.
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}`, { auth: false })

      expect(res.status).toBe(200)
      expect((await res.json()).title).toBe('live on main')
    })

    test('should refuse an anonymous list read that names a branch', async () => {
      const res = await restClient.GET(`/${publicSlug}?branch=visibility`, { auth: false })

      expect(res.status).toBe(403)
    })

    test('should refuse collection document access checks on an unreadable branch', async () => {
      const res = await restClient.POST(
        `/${publicSlug}/access/${publicDocID}?branch=${privateBranch}`,
        { auth: false, body: JSON.stringify({}) },
      )

      expect(res.status).toBe(403)
    })

    test('should refuse global document access checks on an unreadable branch', async () => {
      const res = await restClient.POST(
        `/globals/${headerGlobalSlug}/access?branch=${privateBranch}`,
        {
          auth: false,
          body: JSON.stringify({}),
        },
      )

      expect(res.status).toBe(403)
    })

    test('should serve the branch copy to a reader who can see the branch', async () => {
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=visibility`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)
      expect((await res.json()).title).toBe('unreleased on branch')
    })

    test('should refuse a branch that does not exist', async () => {
      // Same answer as an unreadable branch, deliberately: distinguishing them would
      // tell an anonymous caller which branch names exist.
      const res = await restClient.GET(`/${publicSlug}/${publicDocID}?branch=no-such-branch`, {
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(403)
    })

    test('should let a trusted Local API caller override branch access', async () => {
      const onBranch = await payload.findByID({
        id: publicDocID,
        branch: privateBranch,
        collection: publicSlug,
        overrideAccess: true,
      })

      expect(onBranch.title).toBe('private unreleased content')
    })

    test('should enforce branch access for the Local API by default', async () => {
      await expect(
        payload.findByID({
          id: publicDocID,
          branch: privateBranch,
          collection: publicSlug,
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()
    })

    test('should enforce branch access for Local API global reads', async () => {
      await expect(
        payload.findGlobal({
          slug: headerGlobalSlug,
          branch: privateBranch,
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()
    })

    test('should enforce branch access for Local API merges by default', async () => {
      await expect(
        payload.branches.merge({
          branch: privateBranch,
          dryRun: true,
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()
    })
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

  // What a diff does: the same document, read on two branches, to show what
  // merging one into the other would change.
  test.describe('Reading two branches in one request', () => {
    let docID: number | string

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'two-branch-read' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Two branch read', slug: 'two-branch-read' },
        })
      }
    })

    test.beforeEach(async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'on main' },
      })

      docID = doc.id

      await payload.update({
        id: docID,
        branch: 'two-branch-read',
        collection: postsSlug,
        data: { title: 'on branch' },
      })
    })

    test.afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { equals: 'two-branch-read' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: postsSlug })
      }

      await payload.delete({ id: docID, branch: false, collection: postsSlug })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'two-branch-read' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should return each branch when every read isolates its branch state', async () => {
      const req = await createPayloadRequest({ payload, user: null })

      const [fromMain, fromBranch] = await Promise.all([
        payload.findByID({
          id: docID,
          branch: 'main',
          collection: postsSlug,
          req: isolateBranchState(req),
        }),
        payload.findByID({
          id: docID,
          branch: 'two-branch-read',
          collection: postsSlug,
          req: isolateBranchState(req),
        }),
      ])

      expect(fromMain.title).toBe('on main')
      expect(fromBranch.title).toBe('on branch')
    })

    test('should leave the original request on its own branch after an isolated read', async () => {
      const req = await createPayloadRequest({ branch: 'two-branch-read', payload })

      // Resolve the branch on `req` itself before reading elsewhere, as any
      // operation would.
      const onBranch = await payload.findByID({ id: docID, collection: postsSlug, req })

      await payload.findByID({
        id: docID,
        branch: 'main',
        collection: postsSlug,
        req: isolateBranchState(req),
      })

      const stillOnBranch = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(onBranch.title).toBe('on branch')
      expect(stillOnBranch.title).toBe('on branch')
    })

    test('should follow an explicit branch even when the request already resolved another', async () => {
      const req = await createPayloadRequest({ branch: 'two-branch-read', payload })

      await payload.findByID({ id: docID, collection: postsSlug, req })

      // This used to be impossible: branch state is memoized per request, so a `branch`
      // argument could not redirect a request that had already resolved one, and the read
      // silently returned the first branch's document. An explicit argument now wins, the
      // same contract `locale` has — the operation runs on an isolated request.
      const onMain = await payload.findByID({
        id: docID,
        branch: 'main',
        collection: postsSlug,
        req,
      })

      expect(onMain.title).toBe('on main')

      // And the caller's request is still where it was, which is what "isolated" buys: the
      // read did not rewrite the request underneath whoever owns it.
      const again = await payload.findByID({ id: docID, collection: postsSlug, req })

      expect(again.title).toBe('on branch')
    })

    test('should recheck branch access when an isolated request changes branch and user', async () => {
      const admin = (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: devUser.email } },
        })
      ).docs[0]
      const req = await createPayloadRequest({
        branch: 'two-branch-read',
        payload,
        user: admin as never,
      })

      await assertBranchReadable({ req })

      const isolatedReq = isolateBranchState(req)
      isolatedReq.branch = 'unreadable-branch'
      isolatedReq.user = null

      await expect(assertBranchReadable({ req: isolatedReq })).rejects.toThrow()
    })
  })

  test.describe('Write path — copy-on-write updates', () => {
    let mainDocID: number | string
    const cleanup: (number | string)[] = []

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'cow' } },
      })

      if (!existing.docs.length) {
        await payload.create({ collection: branchesSlug, data: { name: 'COW', slug: 'cow' } })
      }
    })

    test.beforeEach(async () => {
      const doc = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'original on main' },
      })
      mainDocID = doc.id
      cleanup.push(doc.id)
    })

    test.afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: postsSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: postsSlug })
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should leave the main document untouched when updating on a branch', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    test('should refresh branch state across several writes on one request', async () => {
      const req = await createPayloadRequest({ branch: 'cow', payload })
      const beforeWrites = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

      const created = await payload.create({
        collection: postsSlug,
        data: { title: 'created on branch' },
        req,
      })
      const afterCreate = await payload.findByID({ id: created.id, collection: postsSlug, req })

      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { title: 'edited on branch' },
        req,
      })
      const afterUpdate = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

      await payload.delete({ id: mainDocID, collection: postsSlug, req })
      const afterDelete = await payload.findByID({
        id: mainDocID,
        collection: postsSlug,
        disableErrors: true,
        req,
      })

      expect(beforeWrites.title).toBe('original on main')
      expect(afterCreate.title).toBe('created on branch')
      expect(afterUpdate.title).toBe('edited on branch')
      expect(afterDelete).toBeNull()
    })

    test('should create exactly one shadow row on first branch edit', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      // `_branchDocID` is `hidden`, so it is stripped from API responses.
      // Inspecting it is exactly what `showHiddenFields` is for.
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: 'cow' } },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]).not.toHaveProperty('_branchOp')
      expect(shadows.docs[0]).toMatchObject({ title: 'edited on branch' })
      expect(String(shadows.docs[0]!._branchDocID)).toBe(String(mainDocID))
    })

    test('should reuse the existing shadow row on subsequent branch edits', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'first branch edit' },
      })
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'second branch edit' },
      })

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { _branch: { equals: 'cow' } },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!.title).toBe('second branch edit')
    })

    test('should return branch content when reading the branch by canonical ID', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
      })

      expect(onBranch.title).toBe('edited on branch')
      expect(String(onBranch.id)).toBe(String(mainDocID))
    })

    // `select` narrows the row to the fields named, which used to drop
    // `_branchDocID` and leave the canonical-ID projection with nothing to map
    // from — so a branch read surfaced shadow-row primary keys. The admin list
    // view selects only its visible columns, so every row it rendered on a
    // branch linked to an ID that findByID could not resolve.
    test('should keep the canonical ID when a branch find narrows fields with select', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const result = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        select: { title: true },
        where: { title: { equals: 'edited on branch' } },
      })

      expect(result.docs).toHaveLength(1)
      expect(String(result.docs[0]!.id)).toBe(String(mainDocID))
    })

    test('should keep the canonical ID when a branch findByID narrows fields with select', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        select: { title: true },
      })

      expect(String(onBranch.id)).toBe(String(mainDocID))
    })

    test('should keep the canonical ID when a branch find excludes fields with select', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const result = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        select: { order: false },
        where: { title: { equals: 'edited on branch' } },
      })

      expect(result.docs).toHaveLength(1)
      expect(String(result.docs[0]!.id)).toBe(String(mainDocID))
    })

    test('should return the canonical ID on the document an update returns', async () => {
      const updated = await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      expect(String(updated.id)).toBe(String(mainDocID))
    })

    test('should return the canonical ID from an atomic branch-row update', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'forked on branch' },
      })

      const shadow = await payload.db.findOne({
        branch: false,
        collection: postsSlug,
        req: await createPayloadRequest({ branch: false, payload }),
        where: { _branch: { equals: 'cow' } },
      })
      const req = await createPayloadRequest({ branch: 'cow', payload })
      const updated = await payload.db.updateOne({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'atomic branch edit' },
        options: { atomic: true },
        req,
        where: { id: { equals: shadow!.id } },
      })

      expect(String(updated.id)).toBe(String(mainDocID))
      expect(updated.title).toBe('atomic branch edit')
    })

    test('should sort on a branch-modified field using the branch value', async () => {
      const second = await payload.create({
        collection: postsSlug,
        data: { order: 2, title: 'b second on main' },
      })
      cleanup.push(second.id)

      // main order: 'original on main' (1), 'b second on main' (2).
      // On the branch the first document sorts last instead.
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { order: 99 },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        sort: 'order',
      })
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        sort: 'order',
      })

      const branchIDs = onBranch.docs.map((doc) => String(doc.id))
      const mainIDs = onMain.docs.map((doc) => String(doc.id))

      expect(branchIDs.indexOf(String(mainDocID))).toBeGreaterThan(
        branchIDs.indexOf(String(second.id)),
      )
      expect(mainIDs.indexOf(String(mainDocID))).toBeLessThan(mainIDs.indexOf(String(second.id)))
    })

    test('should populate a relationship with the branch version of the related document', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main category' },
      })

      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { category: category.id },
      })

      await payload.update({
        id: category.id,
        branch: 'cow',
        collection: categoriesSlug,
        data: { name: 'branch category' },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        depth: 1,
      })
      const onMain = await payload.findByID({
        id: mainDocID,
        collection: postsSlug,
        depth: 1,
      })

      expect((onBranch.category as { name: string }).name).toBe('branch category')
      expect((onMain.category as { name: string }).name).toBe('main category')

      const shadows = await payload.find({
        branch: false,
        collection: categoriesSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: categoriesSlug })
      }

      await payload.delete({ id: category.id, branch: false, collection: categoriesSlug })
    })

    test('should not double-count a document edited on a branch', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs).toHaveLength(onMain.docs.length)
      expect(onBranch.docs.filter((doc) => String(doc.id) === String(mainDocID))).toHaveLength(1)
    })

    test('should filter on a branch-modified field using the branch value', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'Halloween Sale' },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        where: { title: { like: 'Halloween' } },
      })
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { title: { like: 'Halloween' } },
      })

      expect(onBranch.docs).toHaveLength(1)
      expect(onMain.docs).toHaveLength(0)
    })

    test('should hide a matching main document when its branch replacement does not match', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'does not match main' },
      })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        limit: 1,
        page: 1,
        where: { title: { equals: 'original on main' } },
      })
      const count = await payload.count({
        branch: 'cow',
        collection: postsSlug,
        where: { title: { equals: 'original on main' } },
      })
      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { title: { equals: 'original on main' } },
      })

      expect(onBranch.docs).toHaveLength(0)
      expect(onBranch.totalDocs).toBe(0)
      expect(onBranch.totalPages).toBe(1)
      expect(count.totalDocs).toBe(0)
      expect(onMain.docs).toHaveLength(1)
    })

    test('should hide a relationship-path match replaced by nonmatching branch content', async () => {
      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'main relationship match' },
      })

      await payload.update({
        id: mainDocID,
        collection: postsSlug,
        data: { category: category.id },
      })
      await payload.update({
        id: category.id,
        branch: 'cow',
        collection: categoriesSlug,
        data: { name: 'branch relationship replacement' },
      })

      const mainValueOnBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        where: { 'category.name': { equals: 'main relationship match' } },
      })
      const branchValueOnBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
        where: { 'category.name': { equals: 'branch relationship replacement' } },
      })

      expect(mainValueOnBranch.docs).toHaveLength(0)
      expect(branchValueOnBranch.docs.map((doc) => String(doc.id))).toContain(String(mainDocID))

      const categoryRows = await payload.find({
        branch: false,
        collection: categoriesSlug,
        pagination: false,
        where: {
          or: [{ id: { equals: category.id } }, { _branchDocID: { equals: category.id } }],
        },
      })

      for (const categoryRow of categoryRows.docs) {
        await payload.delete({
          id: categoryRow.id,
          branch: false,
          collection: categoriesSlug,
        })
      }
    })

    test('should record the update in the changeset registry', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({
        collectionSlug: postsSlug,
        documentID: String(mainDocID),
        operation: 'update',
      })
    })

    test('should tombstone rather than delete when deleting a main document on a branch', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const stillOnMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(stillOnMain.title).toBe('original on main')
    })

    test('should hide a document deleted on a branch from that branch only', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const onBranch = await payload.find({
        branch: 'cow',
        collection: postsSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: postsSlug, pagination: false })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(mainDocID))
      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(mainDocID))
    })

    test('should store deletion state only in the delete change', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      const tombstone = await payload.db.findOne({
        branch: false,
        collection: postsSlug,
        req: rawReq,
        where: {
          and: [{ _branch: { equals: 'cow' } }, { _branchDocID: { equals: mainDocID } }],
        },
      })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        disableErrors: true,
      })
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(tombstone).not.toHaveProperty('_branchOp')
      expect(onBranch).toBeNull()
      expect(onMain.title).toBe('original on main')
    })

    test('should record the delete in the changeset registry', async () => {
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'cow' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })
    })

    test('should hard-delete a document created on the same branch', async () => {
      const created = await payload.create({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'created then deleted on branch' },
      })

      await payload.delete({ id: created.id, branch: 'cow', collection: postsSlug })

      const rows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: created.id } },
      })

      expect(rows.docs).toHaveLength(0)
    })

    test('should use the create change to hard-delete a branch-created document', async () => {
      const created = await payload.create({
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'created then deleted by change operation' },
      })
      const rawReq = await createPayloadRequest({ branch: false, payload })

      await payload.delete({ id: created.id, branch: 'cow', collection: postsSlug })

      const rows = await payload.db.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        req: rawReq,
        where: { id: { equals: created.id } },
      })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(created.id) } },
      })

      expect(rows.docs).toHaveLength(0)
      expect(changes.docs).toHaveLength(0)
    })

    test('should use the update change to tombstone an edited main document', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'edited before delete' },
      })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      await payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        disableErrors: true,
      })
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(mainDocID) } },
      })

      expect(onBranch).toBeNull()
      expect(onMain.title).toBe('original on main')
      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })
    })

    test('should reject a delete when the branch row has no change record', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'orphaned branch edit' },
      })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(mainDocID) } },
      })

      await payload.db.deleteOne({
        collection: branchChangesSlug,
        req: rawReq,
        where: { id: { equals: changes.docs[0]!.id } },
      })

      await expect(
        payload.delete({ id: mainDocID, branch: 'cow', collection: postsSlug }),
      ).rejects.toMatchObject({ status: 409 })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const shadows = await payload.db.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        req: rawReq,
        where: {
          and: [{ _branch: { equals: 'cow' } }, { _branchDocID: { equals: mainDocID } }],
        },
      })

      expect(onMain.title).toBe('original on main')
      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!.title).toBe('orphaned branch edit')
    })

    test('should reject an update when the branch row has no change record', async () => {
      await payload.update({
        id: mainDocID,
        branch: 'cow',
        collection: postsSlug,
        data: { title: 'orphaned branch edit' },
      })

      const rawReq = await createPayloadRequest({ branch: false, payload })
      const changes = await payload.db.find({
        collection: branchChangesSlug,
        pagination: false,
        req: rawReq,
        where: { documentID: { equals: String(mainDocID) } },
      })

      await payload.db.deleteOne({
        collection: branchChangesSlug,
        req: rawReq,
        where: { id: { equals: changes.docs[0]!.id } },
      })

      await expect(
        payload.update({
          id: mainDocID,
          branch: 'cow',
          collection: postsSlug,
          data: { title: 'second branch edit' },
        }),
      ).rejects.toMatchObject({ status: 409 })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const shadows = await payload.db.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        req: rawReq,
        where: {
          and: [{ _branch: { equals: 'cow' } }, { _branchDocID: { equals: mainDocID } }],
        },
      })

      expect(onMain.title).toBe('original on main')
      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]!.title).toBe('orphaned branch edit')
    })

    test('should allow the same unique value on two different branches', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { slug: 'shared' },
      })

      // The unique index is rewritten to `(slug, _branch)`, so each branch may hold
      // its own document claiming the value while main still holds one too.
      const onCow = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { slug: 'shared' },
      })
      const onQ4 = await payload.create({
        branch: 'q4',
        collection: uniqueSlug,
        data: { slug: 'shared' },
      })

      expect(String(onCow.id)).not.toBe(String(onMain.id))
      expect(String(onQ4.id)).not.toBe(String(onMain.id))

      // Still enforced within a single branch.
      await expect(
        payload.create({ branch: 'cow', collection: uniqueSlug, data: { slug: 'shared' } }),
      ).rejects.toThrow()

      for (const id of [onMain.id, onCow.id, onQ4.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { collectionSlug: { equals: uniqueSlug } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should enforce localized uniqueness per locale and branch', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { localizedSlug: 'localized-shared' },
        locale: 'en',
      })

      await payload.update({
        id: onMain.id,
        collection: uniqueSlug,
        data: { localizedSlug: 'main-spanish' },
        locale: 'es',
      })

      const onCow = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { localizedSlug: 'localized-shared' },
        locale: 'en',
      })

      await expect(
        payload.create({
          collection: uniqueSlug,
          data: { localizedSlug: 'localized-shared' },
          locale: 'en',
        }),
      ).rejects.toThrow()
      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { localizedSlug: 'localized-shared' },
          locale: 'en',
        }),
      ).rejects.toThrow()

      for (const id of [onMain.id, onCow.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { collectionSlug: { equals: uniqueSlug } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    test('should allow a nested unique value on main and a branch', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { metadata: { code: 'nested-shared' } },
      })
      const onBranch = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { metadata: { code: 'nested-shared' } },
      })

      expect(String(onBranch.id)).not.toBe(String(onMain.id))

      for (const id of [onMain.id, onBranch.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }
    })

    test('should reject a duplicate nested unique value within one branch', async () => {
      const first = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { metadata: { code: 'nested-duplicate' } },
      })

      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { metadata: { code: 'nested-duplicate' } },
        }),
      ).rejects.toThrow()

      await payload.delete({ id: first.id, branch: false, collection: uniqueSlug })
    })

    test('should allow a custom compound value on main and a branch', async () => {
      const onMain = await payload.create({
        collection: uniqueSlug,
        data: { customSlug: 'shared', site: 'example' },
      })
      const onBranch = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { customSlug: 'shared', site: 'example' },
      })

      expect(String(onBranch.id)).not.toBe(String(onMain.id))

      for (const id of [onMain.id, onBranch.id]) {
        await payload.delete({ id, branch: false, collection: uniqueSlug })
      }
    })

    test('should reject a duplicate custom compound value within one branch', async () => {
      const first = await payload.create({
        branch: 'cow',
        collection: uniqueSlug,
        data: { customSlug: 'duplicate', site: 'example' },
      })

      await expect(
        payload.create({
          branch: 'cow',
          collection: uniqueSlug,
          data: { customSlug: 'duplicate', site: 'example' },
        }),
      ).rejects.toThrow()

      await payload.delete({ id: first.id, branch: false, collection: uniqueSlug })
    })
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

    /**
     * Versions main records *after* a branch forked are not that branch's past, so
     * its history should stop at the fork point. Blocked on there being a marker to
     * stop at: the registry stores `baseUpdatedAt`, which is main's *document*
     * `updatedAt` at fork, and version rows are written just after the document — so
     * comparing a version's `updatedAt` against it excludes main's latest version,
     * the one that matters most for ancestry. Needs a fork-time marker of its own;
     * `baseUpdatedAt` cannot be repurposed because §16's "main moved" warning depends
     * on its current meaning.
     */
    test.todo('should exclude main versions recorded after the branch forked')

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

  test.describe('Uploads on a branch', () => {
    const cleanup: (number | string)[] = []

    test.beforeAll(async () => {
      const existing = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'uploadwork' } },
      })

      if (!existing.docs.length) {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Upload work', slug: 'uploadwork' },
        })
      }
    })

    test.afterEach(async () => {
      const shadows = await payload.find({
        branch: false,
        collection: mediaSlug,
        pagination: false,
        where: { _branch: { not_equals: 'main' } },
      })

      for (const shadow of shadows.docs) {
        await payload.delete({ id: shadow.id, branch: false, collection: mediaSlug })
      }

      for (const id of cleanup) {
        await payload.delete({ id, branch: false, collection: mediaSlug }).catch(() => {})
      }
      cleanup.length = 0

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'uploadwork' } },
      })

      for (const change of changes.docs) {
        await payload.delete({ id: change.id, collection: branchChangesSlug })
      }
    })

    const createOnMain = async (name: string) => {
      const data = Buffer.from(`bytes for ${name}`)
      const doc = await payload.create({
        collection: mediaSlug,
        data: { alt: 'on main' },
        file: {
          name,
          data,
          mimetype: 'text/plain',
          size: data.length,
        },
      })
      cleanup.push(doc.id)

      return doc
    }

    // `filename` is unique on upload collections, and it is added after branch
    // field injection runs — so it kept a global unique index and a branch's copy
    // of the row collided with main's, failing validation outright.
    test('should allow forking an upload onto a branch despite the unique filename', async () => {
      const media = await createOnMain('fork-me.txt')

      await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'on branch' },
      })

      const onBranch = await payload.findByID({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
      })
      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onBranch.alt).toBe('on branch')
      expect(onMain.alt).toBe('on main')
    })

    // `deleteAssociatedFiles` ran before `db.deleteOne` decided the delete was a
    // tombstone, so main lost the file its surviving row still points at.
    test('should keep the file on main when deleting an upload on a branch', async () => {
      const fs = await import('fs')
      const media = await createOnMain('keep-me.txt')
      const filePath = path.resolve(dirname, 'media', media.filename)

      expect(fs.existsSync(filePath)).toBe(true)

      await payload.delete({ id: media.id, branch: 'uploadwork', collection: mediaSlug })

      expect(fs.existsSync(filePath)).toBe(true)

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onMain.alt).toBe('on main')
    })

    test('should keep the main file when replacing an upload on a branch', async () => {
      const fs = await import('fs')
      const media = await createOnMain('keep-original-on-replace.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const replacementData = Buffer.from('branch replacement bytes')

      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch replacement' },
        file: {
          name: 'branch-replacement.txt',
          data: replacementData,
          mimetype: 'text/plain',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)
      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(replaced.filename).toBe('branch-replacement.txt')
      expect(fs.existsSync(mainFilePath)).toBe(true)
      expect(fs.existsSync(replacementFilePath)).toBe(true)
      expect(fs.readFileSync(mainFilePath, 'utf8')).toBe('bytes for keep-original-on-replace.txt')
      expect(fs.readFileSync(replacementFilePath, 'utf8')).toBe('branch replacement bytes')
      expect(onMain.filename).toBe(media.filename)
    })

    test.options(
      'should preserve a temp-file upload across a transient final commit retry',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        const fs = await import('fs/promises')
        const os = await import('os')
        const media = await createOnMain('temp-retry-main.txt')
        const replacementData = Buffer.from('temp-file retry replacement bytes')
        const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'payload-temp-retry-'))
        const tempFilePath = path.join(temporaryDirectory, 'replacement.txt')
        const previousUseTempFiles = payload.config.upload.useTempFiles
        const commitTransaction = payload.db.commitTransaction.bind(payload.db)
        const commitError = Object.assign(new Error('Simulated first final commit conflict'), {
          errorLabels: ['TransientTransactionError'],
        })
        let commitAttempts = 0

        await fs.writeFile(tempFilePath, replacementData)
        payload.config.upload.useTempFiles = true

        const commitSpy = vi
          .spyOn(payload.db, 'commitTransaction')
          .mockImplementation(async (transactionID) => {
            commitAttempts += 1

            if (commitAttempts === 1) {
              throw commitError
            }

            return commitTransaction(transactionID)
          })

        try {
          const replaced = await payload.update({
            id: media.id,
            branch: 'uploadwork',
            collection: mediaSlug,
            data: { alt: 'temp-file branch replacement' },
            file: {
              name: 'temp-retry-replacement.txt',
              data: Buffer.alloc(0),
              mimetype: 'text/plain',
              size: replacementData.length,
              tempFilePath,
            },
          })
          const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

          expect(commitAttempts).toBe(2)
          expect(await fs.readFile(replacementFilePath)).toEqual(replacementData)
          await expect(fs.access(tempFilePath)).rejects.toMatchObject({ code: 'ENOENT' })
        } finally {
          commitSpy.mockRestore()
          payload.config.upload.useTempFiles = previousUseTempFiles
          await fs.rm(temporaryDirectory, { force: true, recursive: true })
        }
      },
    )

    test.options(
      'should remove a branch upload when its final database commit fails',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        const fs = await import('fs/promises')
        const media = await createOnMain('upload-rollback-main.txt')
        const originalFilePath = path.resolve(dirname, 'media', media.filename)
        const replacementFilePath = path.resolve(dirname, 'media', 'upload-rollback-failed.txt')
        const replacementData = Buffer.from('upload that must be rolled back')
        const commitError = new Error('Simulated final commit failure')
        let commitAttempts = 0
        const commitSpy = vi.spyOn(payload.db, 'commitTransaction').mockImplementation(() => {
          commitAttempts += 1
          throw commitError
        })

        try {
          await expect(
            payload.update({
              id: media.id,
              branch: 'uploadwork',
              collection: mediaSlug,
              data: { alt: 'failed branch replacement' },
              file: {
                name: path.basename(replacementFilePath),
                data: replacementData,
                mimetype: 'text/plain',
                size: replacementData.length,
              },
            }),
          ).rejects.toBe(commitError)
        } finally {
          commitSpy.mockRestore()
        }

        expect(commitAttempts).toBe(1)
        expect(await fs.readFile(originalFilePath, 'utf8')).toBe(
          'bytes for upload-rollback-main.txt',
        )
        await expect(fs.access(replacementFilePath)).rejects.toMatchObject({ code: 'ENOENT' })
      },
    )

    test('should remove a replacement file when discarding a branch upload edit', async () => {
      const fs = await import('fs')
      const media = await createOnMain('keep-original-on-discard.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const replacementData = Buffer.from('discarded branch replacement bytes')
      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'discarded replacement' },
        file: {
          name: 'discarded-branch-replacement.txt',
          data: replacementData,
          mimetype: 'text/plain',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

      expect(replaced.filename).toBe('discarded-branch-replacement.txt')

      await payload.branches.discard({ branch: 'uploadwork' })

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(fs.existsSync(mainFilePath)).toBe(true)
      expect(fs.existsSync(replacementFilePath)).toBe(false)
      expect(onMain.filename).toBe(media.filename)
    })

    test('should remove the superseded main file when merging a branch upload replacement', async () => {
      const fs = await import('fs')
      const media = await createOnMain('remove-original-on-merge.txt')
      const mainFilePath = path.resolve(dirname, 'media', media.filename)
      const replacementData = Buffer.from('merged branch replacement bytes')
      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'merged replacement' },
        file: {
          name: 'merged-branch-replacement.txt',
          data: replacementData,
          mimetype: 'text/plain',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)

      expect(replaced.filename).toBe('merged-branch-replacement.txt')

      await payload.branches.merge({ branch: 'uploadwork' })

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(fs.existsSync(mainFilePath)).toBe(false)
      expect(fs.existsSync(replacementFilePath)).toBe(true)
      expect(onMain.filename).toBe(replaced.filename)
    })

    test('should ignore unrelated upload edits when merging a branch upload replacement', async () => {
      const fs = await import('fs')
      const mainFileData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.png'))
      const media = await payload.create({
        collection: mediaSlug,
        data: { alt: 'main image' },
        file: {
          name: 'merge-query-main.png',
          data: mainFileData,
          mimetype: 'image/png',
          size: mainFileData.length,
        },
      })
      const replacementData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.jpg'))
      const replaced = await payload.update({
        id: media.id,
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch image' },
        file: {
          name: 'merge-query-branch.jpg',
          data: replacementData,
          mimetype: 'image/jpeg',
          size: replacementData.length,
        },
      })
      const replacementFilePath = path.resolve(dirname, 'media', replaced.filename)
      const expectedReplacementData = fs.readFileSync(replacementFilePath)
      const req = await createPayloadRequest({ payload })
      const uploadEdits = {
        crop: { height: 50, unit: '%' as const, width: 50, x: 0, y: 0 },
        heightInPixels: 20,
        widthInPixels: 20,
      }

      cleanup.push(media.id)
      req.query = { unrelated: 'preserve me', uploadEdits }

      await payload.branches.merge({ branch: 'uploadwork', req })

      const onMain = await payload.findByID({ id: media.id, collection: mediaSlug })

      expect(onMain.filename).toBe(replaced.filename)
      expect(fs.readFileSync(replacementFilePath)).toEqual(expectedReplacementData)
      expect(req.query.unrelated).toBe('preserve me')
      expect(req.query.uploadEdits).toBe(uploadEdits)
    })

    test('should hide an upload deleted on a branch from that branch only', async () => {
      const media = await createOnMain('hide-me.txt')

      await payload.delete({ id: media.id, branch: 'uploadwork', collection: mediaSlug })

      const onBranch = await payload.find({
        branch: 'uploadwork',
        collection: mediaSlug,
        pagination: false,
      })
      const onMain = await payload.find({ collection: mediaSlug, pagination: false })

      expect(onBranch.docs.map((doc) => String(doc.id))).not.toContain(String(media.id))
      expect(onMain.docs.map((doc) => String(doc.id))).toContain(String(media.id))
    })

    test('should delete the file when removing an upload created on that branch', async () => {
      const fs = await import('fs')

      const created = await payload.create({
        branch: 'uploadwork',
        collection: mediaSlug,
        data: { alt: 'branch only' },
        file: {
          name: 'branch-only.txt',
          data: Buffer.from('branch only bytes'),
          mimetype: 'text/plain',
          size: 17,
        },
      })

      const filePath = path.resolve(dirname, 'media', created.filename)

      expect(fs.existsSync(filePath)).toBe(true)

      await payload.delete({ id: created.id, branch: 'uploadwork', collection: mediaSlug })

      expect(fs.existsSync(filePath)).toBe(false)
    })
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

  test.describe('Joins', () => {
    let categoryID: number | string
    let mainPostID: number | string
    let branchPostID: number | string

    test.beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Join work', slug: 'joinwork' },
      })

      const category = await payload.create({
        collection: categoriesSlug,
        data: { name: 'News' },
      })
      categoryID = category.id

      const mainPost = await payload.create({
        collection: postsSlug,
        data: { category: categoryID, title: 'main post' },
      })
      mainPostID = mainPost.id

      const branchPost = await payload.create({
        branch: 'joinwork',
        collection: postsSlug,
        data: { category: categoryID, title: 'branch post' },
      })
      branchPostID = branchPost.id
    })

    test.afterEach(async () => {
      for (const slug of [postsSlug, pagesSlug, categoriesSlug]) {
        const rows = await payload.find({
          branch: false,
          collection: slug,
          pagination: false,
        })

        for (const row of rows.docs) {
          await payload.delete({
            id: row.id,
            branch: false,
            collection: slug,
          })
        }
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const rows = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'joinwork' } },
        })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    test('should exclude branch-created documents from a join read on main', async () => {
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })
      const ids = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).not.toContain(String(branchPostID))
    })

    test('should include branch-created documents in a join read on that branch', async () => {
      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const ids = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids).toContain(String(mainPostID))
      expect(ids).toContain(String(branchPostID))
    })

    test('should exclude branch-deleted documents from a join read on that branch', async () => {
      await payload.delete({ id: mainPostID, branch: 'joinwork', collection: postsSlug })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })

      const branchIDs = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))
      const mainIDs = (onMain.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(branchIDs).not.toContain(String(mainPostID))
      expect(mainIDs).toContain(String(mainPostID))
    })

    test('should not surface a shadow row as a separate join entry', async () => {
      await payload.update({
        id: mainPostID,
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const ids = (onBranch.posts?.docs ?? []).map((doc: any) => String(doc?.id ?? doc))

      expect(ids.filter((id) => id === String(mainPostID))).toHaveLength(1)
    })

    test('should filter join paths with the active branch content', async () => {
      await payload.update({
        id: mainPostID,
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited join title' },
      })

      const mainTitleOnBranch = await payload.find({
        branch: 'joinwork',
        collection: categoriesSlug,
        where: { 'posts.title': { equals: 'main post' } },
      })
      const branchTitleOnBranch = await payload.find({
        branch: 'joinwork',
        collection: categoriesSlug,
        where: { 'posts.title': { equals: 'edited join title' } },
      })
      const mainTitleCount = await payload.count({
        branch: 'joinwork',
        collection: categoriesSlug,
        where: { 'posts.title': { equals: 'main post' } },
      })

      expect(mainTitleOnBranch.docs).toHaveLength(0)
      expect(mainTitleOnBranch.totalDocs).toBe(0)
      expect(mainTitleCount.totalDocs).toBe(0)
      expect(branchTitleOnBranch.docs.map((doc) => String(doc.id))).toContain(String(categoryID))
    })

    test('should use the active branch draft in a join read', async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'draft', category: categoryID, title: 'main draft' },
        draft: true,
      })

      await payload.update({
        id: page.id,
        branch: 'joinwork',
        collection: pagesSlug,
        data: { title: 'branch draft' },
        draft: true,
      })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
        draft: true,
      })
      const onMain = await payload.findByID({
        id: categoryID,
        collection: categoriesSlug,
        draft: true,
      })
      const branchDraft = (onBranch as any).pages?.docs[0]
      const mainDraft = (onMain as any).pages?.docs[0]

      expect(branchDraft?.title).toBe('branch draft')
      expect(mainDraft?.title).toBe('main draft')
    })

    test('should return a canonical document ID from a branch draft join', async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { _status: 'draft', category: categoryID, title: 'main draft' },
        draft: true,
      })

      await payload.update({
        id: page.id,
        branch: 'joinwork',
        collection: pagesSlug,
        data: { title: 'branch draft' },
        draft: true,
      })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
        draft: true,
      })
      const branchDraft = (onBranch as any).pages?.docs[0]

      expect(String(branchDraft?.id ?? branchDraft)).toBe(String(page.id))
    })

    test('should scope every polymorphic join target to the active branch', async () => {
      const mainPage = await payload.create({
        collection: pagesSlug,
        data: { category: categoryID, title: 'main page' },
      })
      const branchPage = await payload.create({
        branch: 'joinwork',
        collection: pagesSlug,
        data: { category: categoryID, title: 'branch page' },
      })

      await payload.update({
        id: mainPostID,
        branch: 'joinwork',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
      await payload.delete({ id: mainPage.id, branch: 'joinwork', collection: pagesSlug })

      const onBranch = await payload.findByID({
        id: categoryID,
        branch: 'joinwork',
        collection: categoriesSlug,
      })
      const onMain = await payload.findByID({ id: categoryID, collection: categoriesSlug })
      const getReferences = (
        docs: Array<{ relationTo: string; value: { id: number | string } | number | string }>,
      ) =>
        docs.map(
          ({ relationTo, value }) =>
            `${relationTo}:${String(typeof value === 'object' ? value.id : value)}`,
        )
      const branchReferences = getReferences(onBranch.content?.docs ?? [])
      const mainReferences = getReferences(onMain.content?.docs ?? [])

      expect(
        branchReferences.filter((reference) => reference === `${postsSlug}:${mainPostID}`),
      ).toHaveLength(1)
      expect(branchReferences).toContain(`${pagesSlug}:${branchPage.id}`)
      expect(branchReferences).not.toContain(`${pagesSlug}:${mainPage.id}`)
      expect(mainReferences).toContain(`${postsSlug}:${mainPostID}`)
      expect(mainReferences).toContain(`${pagesSlug}:${mainPage.id}`)
      expect(mainReferences).not.toContain(`${pagesSlug}:${branchPage.id}`)
    })
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
        expect.objectContaining({ collectionSlug: pagesSlug, docID: page.id, operation: 'update' }),
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
            and: [{ branch: { equals: 'accesswork' } }, { collectionSlug: { equals: nestedSlug } }],
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
            and: [{ branch: { equals: 'accesswork' } }, { collectionSlug: { equals: pagesSlug } }],
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
            and: [{ branch: { equals: 'accesswork' } }, { collectionSlug: { equals: pagesSlug } }],
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
            and: [{ branch: { equals: 'accesswork' } }, { collectionSlug: { equals: pagesSlug } }],
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

    test('should reject malformed prepared content with the default validator', async () => {
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
    })

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

    test('should let replacement validation replace only the precheck', async () => {
      await corruptBranchTitle()
      hookSpy.branchValidation = () => ({ errors: [], valid: true })

      const preview = await payload.branches.merge({ branch, dryRun: true })

      expect(preview.canMerge).toBe(true)
      expect(preview.validationErrors).toHaveLength(0)

      await expect(payload.branches.merge({ branch })).rejects.toThrow()

      const onMain = await payload.findByID({ id: mainDocumentID, collection: pagesSlug })

      expect(onMain.title).toBe('main validation title')
    })

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
      expect(result.errors.some(({ path }) => path?.startsWith('data.unstructuredMetadata'))).toBe(
        false,
      )
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

  /**
   * §16's branch lifecycle. A branch is the workspace and a merge is an event, so
   * merging does not end a branch — closing it does, and only when asked.
   */
  test.describe('Branch lifecycle after merging', () => {
    let mainDocID: number | string

    const branchStatus = async (slug: string) =>
      (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: slug } },
        })
      ).docs[0]

    test.beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Life cycle', slug: 'lifecycle' },
      })

      const doc = await payload.create({
        collection: postsSlug,
        data: {
          confidential: 'main secret',
          internalNote: 'hidden main value',
          order: 1,
          title: 'original on main',
        },
      })

      mainDocID = doc.id

      await payload.update({
        id: mainDocID,
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    test.afterEach(async () => {
      hookSpy.postBeforeRead = undefined
      hookSpy.postDefaultValueCount = undefined
      hookSpy.postTitleAfterReadCount = undefined
      hookSpy.restrictLedgerSnapshotEntityRead = undefined
      hookSpy.restrictLedgerSnapshotGlobalRead = undefined

      for (const collection of [pagesSlug, postsSlug]) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection })
        }
      }

      for (const collection of [branchChangesSlug, branchMergesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'lifecycle' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }

      const ledgerReaders = await payload.find({
        collection: 'users',
        pagination: false,
        where: { email: { equals: 'ledger-reader@example.com' } },
      })

      for (const ledgerReader of ledgerReaders.docs) {
        await payload.delete({ id: ledgerReader.id, collection: 'users' })
      }
    })

    test('should record a ledger entry naming what the merge applied', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      const events = await payload.find({
        collection: branchMergesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      expect(events.docs).toHaveLength(1)

      const event = events.docs[0]! as unknown as {
        changes: { collectionSlug: string; docID: string; docTitle: string; operation: string }[]
        mergedAt: string
      }

      expect(event.mergedAt).toBeTruthy()
      expect(event.changes).toHaveLength(1)
      // Snapshotted at merge time, so renaming the document later cannot rewrite
      // what the ledger says was merged.
      expect(event.changes[0]).toMatchObject({
        collectionSlug: postsSlug,
        docID: String(mainDocID),
        docTitle: 'edited on branch',
        operation: 'update',
      })
    })

    test('should checkpoint large merge events with bounded database writes', async () => {
      for (let index = 0; index < 100; index += 1) {
        await payload.create({
          branch: 'lifecycle',
          collection: postsSlug,
          data: { title: `checkpoint document ${index}` },
        })
      }

      const updateOne = payload.db.updateOne.bind(payload.db)
      let mergeEventUpdateCount = 0
      const updateOneSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
        if (args.collection === branchMergesSlug) {
          mergeEventUpdateCount += 1
        }

        return updateOne(args)
      })

      try {
        await payload.branches.merge({ branch: 'lifecycle' })
      } finally {
        updateOneSpy.mockRestore()
      }

      const mergeEvent = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0] as unknown as {
        changes: { applicationOutcome: string; cleanupOutcome: string }[]
      }

      expect(mergeEvent.changes).toHaveLength(101)
      expect(
        mergeEvent.changes.every(
          ({ applicationOutcome, cleanupOutcome }) =>
            applicationOutcome === 'committed' && cleanupOutcome === 'completed',
        ),
      ).toBe(true)
      expect(mergeEventUpdateCount).toBeLessThan(20)
    })

    test('should not store full document snapshots in a merge event', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]! as unknown as {
        changes: { after?: Record<string, unknown>; before?: Record<string, unknown> }[]
      }

      expect(event.changes[0]?.before).toBeUndefined()
      expect(event.changes[0]?.after).toBeUndefined()
    })

    test('should record the exact target version before and after a versioned merge', async () => {
      const page = await payload.create({
        collection: pagesSlug,
        data: { title: 'version reference before' },
      })

      try {
        const beforeVersions = await payload.db.findVersions({
          branch: false,
          collection: pagesSlug,
          limit: 1,
          pagination: false,
          req: await createPayloadRequest({ branch: false, payload }),
          sort: '-updatedAt',
          where: { parent: { equals: page.id } },
        })

        await payload.update({
          id: page.id,
          branch: 'lifecycle',
          collection: pagesSlug,
          data: { title: 'version reference after' },
        })
        await payload.branches.merge({ branch: 'lifecycle' })

        const afterVersions = await payload.db.findVersions({
          branch: false,
          collection: pagesSlug,
          limit: 1,
          pagination: false,
          req: await createPayloadRequest({ branch: false, payload }),
          sort: '-updatedAt',
          where: { parent: { equals: page.id } },
        })
        const mergeEvent = (
          await payload.find({
            collection: branchMergesSlug,
            pagination: false,
            where: { branch: { equals: 'lifecycle' } },
          })
        ).docs[0] as unknown as {
          changes: {
            afterVersionID?: string
            beforeVersionID?: string
            collectionSlug?: string
          }[]
        }
        const pageChange = mergeEvent.changes.find(
          ({ collectionSlug }) => collectionSlug === pagesSlug,
        )

        expect(pageChange?.beforeVersionID).toBe(String(beforeVersions.docs[0]?.id))
        expect(pageChange?.afterVersionID).toBe(String(afterVersions.docs[0]?.id))
        expect(pageChange?.afterVersionID).not.toBe(pageChange?.beforeVersionID)
      } finally {
        await payload.delete({ id: page.id, branch: false, collection: pagesSlug })
      }
    })

    test('should expose a merge ledger entry only to the user who created it', async () => {
      const mergingUser = (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: devUser.email } },
        })
      ).docs[0]!
      const otherUser = await payload.create({
        collection: 'users',
        data: { email: 'ledger-reader@example.com', password: 'test' },
      })

      await payload.branches.merge({
        branch: 'lifecycle',
        overrideAccess: false,
        user: { ...mergingUser, collection: 'users' } as never,
      })

      await payload.create({
        collection: branchMergesSlug,
        data: {
          branch: 'lifecycle',
          changes: [],
          mergedAt: new Date().toISOString(),
          mergedByID: String(mergingUser.id),
        },
      })

      const ownEvents = await payload.find({
        collection: branchMergesSlug,
        overrideAccess: false,
        pagination: false,
        user: { ...mergingUser, collection: 'users' } as never,
        where: { branch: { equals: 'lifecycle' } },
      })
      const otherEvents = await payload.find({
        collection: branchMergesSlug,
        overrideAccess: false,
        pagination: false,
        user: { ...otherUser, collection: 'users' } as never,
        where: { branch: { equals: 'lifecycle' } },
      })
      const collidingAuthCollectionEvents = await payload.find({
        collection: branchMergesSlug,
        overrideAccess: false,
        pagination: false,
        user: { ...mergingUser, collection: 'secondary-users' } as never,
        where: { branch: { equals: 'lifecycle' } },
      })

      expect(ownEvents.docs).toHaveLength(2)
      expect(otherEvents.docs).toHaveLength(0)
      expect(collidingAuthCollectionEvents.docs).toHaveLength(0)
    })

    test('should enforce field read rules when recording a merge-event title', async () => {
      const mergingUser = await payload.create({
        collection: 'users',
        data: { email: 'ledger-reader@example.com', password: 'test' },
      })

      await payload.branches.merge({
        branch: 'lifecycle',
        overrideAccess: true,
        user: { ...mergingUser, collection: 'users' } as never,
      })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]! as unknown as {
        changes: {
          after?: Record<string, unknown>
          before?: Record<string, unknown>
          docTitle?: string
        }[]
      }

      expect(event.changes[0]?.before).toBeUndefined()
      expect(event.changes[0]?.after).toBeUndefined()
      expect(event.changes[0]?.docTitle).toBe(String(mainDocID))
    })

    test('should apply collection read constraints to a merge-event title', async () => {
      const mergingUser = await payload.create({
        collection: 'users',
        data: { email: 'ledger-reader@example.com', password: 'test' },
      })

      hookSpy.restrictLedgerSnapshotEntityRead = true

      await payload.update({
        id: mainDocID,
        branch: 'lifecycle',
        collection: postsSlug,
        data: { order: 2 },
      })

      await payload.branches.merge({
        branch: 'lifecycle',
        overrideAccess: true,
        user: { ...mergingUser, collection: 'users' } as never,
      })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]! as unknown as {
        changes: {
          after?: null | Record<string, unknown>
          before?: Record<string, unknown>
          docTitle?: string
        }[]
      }

      expect(event.changes[0]?.before).toBeUndefined()
      expect(event.changes[0]?.after).toBeUndefined()
      expect(event.changes[0]?.docTitle).toBe(String(mainDocID))
    })

    test('should not evaluate field defaults while resolving a merge-event title', async () => {
      const req = await createPayloadRequest({ branch: false, payload })

      hookSpy.postDefaultValueCount = 0

      const snapshot = await readCollectionMergeSnapshot({
        collectionSlug: postsSlug,
        docID: mainDocID,
        payload,
        req,
      })

      expect(hookSpy.postDefaultValueCount).toBe(0)
      expect(snapshot).not.toHaveProperty('computedDefault')
    })

    test('should not run field read hooks while resolving a merge-event title', async () => {
      const req = await createPayloadRequest({ branch: false, payload })

      hookSpy.postTitleAfterReadCount = 0

      const snapshot = await readCollectionMergeSnapshot({
        collectionSlug: postsSlug,
        docID: mainDocID,
        payload,
        req,
      })

      expect(snapshot?.title).toBe('original on main')
      expect(hookSpy.postTitleAfterReadCount).toBe(0)
    })

    test('should not let a collection read hook failure abort a merge', async () => {
      hookSpy.postBeforeRead = () => {
        throw new Error('snapshot read hook must not run')
      }

      const result = await payload.branches.merge({
        branch: 'lifecycle',
        overrideAccess: true,
      })

      expect(result.merged).toHaveLength(1)
    })

    test('should keep merge ledger writes server-owned', async () => {
      const user = (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: devUser.email } },
        })
      ).docs[0]!

      await payload.branches.merge({ branch: 'lifecycle' })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]!
      const createResult = await payload
        .create({
          collection: branchMergesSlug,
          data: { branch: 'lifecycle', changes: [], mergedAt: new Date().toISOString() },
          overrideAccess: false,
          user: { ...user, collection: 'users' } as never,
        })
        .then(
          () => 'fulfilled',
          () => 'rejected',
        )
      const deleteResult = await payload
        .delete({
          id: event.id,
          collection: branchMergesSlug,
          overrideAccess: false,
          user: { ...user, collection: 'users' } as never,
        })
        .then(
          () => 'fulfilled',
          () => 'rejected',
        )

      expect({ createResult, deleteResult }).toEqual({
        createResult: 'rejected',
        deleteResult: 'rejected',
      })
    })

    test('should record a branch-created title without full document snapshots', async () => {
      const created = await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      const createChange = changes.docs.find(
        (change) =>
          change.operation === 'create' &&
          String((change.doc as { value?: unknown })?.value) === String(created.id),
      )

      await payload.branches.merge({ branch: 'lifecycle', changes: [createChange!.id] })

      const event = (
        await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'lifecycle' } },
        })
      ).docs[0]! as unknown as {
        changes: { after?: Record<string, unknown>; before?: null | Record<string, unknown> }[]
      }

      expect(event.changes[0]?.before).toBeUndefined()
      expect(event.changes[0]?.after).toBeUndefined()
      expect((event.changes[0] as { docTitle?: string })?.docTitle).toBe('created on branch')
    })

    test('should keep the branch open when only some changes are merged', async () => {
      const second = await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      const updateChange = changes.docs.find((change) => change.operation === 'update')

      await payload.branches.merge({ branch: 'lifecycle', changes: [updateChange!.id] })

      expect((await branchStatus('lifecycle'))?.status).toBe('open')

      // And it is still workable: the unmerged change is untouched.
      const onBranch = await payload.findByID({
        id: second.id,
        branch: 'lifecycle',
        collection: postsSlug,
      })

      expect(onBranch.title).toBe('created on branch')
    })

    test('should mark the branch merged but not closed when everything is applied', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      const branch = await branchStatus('lifecycle')

      expect(branch?.status).toBe('merged')
      expect(branch?.mergedAt).toBeTruthy()
    })

    test('should reopen a merged branch as soon as it has a change again', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      expect((await branchStatus('lifecycle'))?.status).toBe('merged')

      await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'more work after merging' },
      })

      // The branch is the workspace; merging it did not end it.
      const branch = await branchStatus('lifecycle')

      expect(branch?.status).toBe('open')
      expect(branch?.mergedAt).toBeFalsy()
    })

    test('should close the branch when the merge asks for it', async () => {
      await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

      const branch = await branchStatus('lifecycle')

      expect(branch?.status).toBe('closed')
      expect(branch?.mergedAt).toBeTruthy()
    })

    test('should leave the branch open when a partial merge asks to close it', async () => {
      await payload.create({
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'lifecycle' } },
      })

      const updateChange = changes.docs.find((change) => change.operation === 'update')

      // Closing a branch that still holds work would abandon it.
      await payload.branches.merge({
        branch: 'lifecycle',
        changes: [updateChange!.id],
        closeBranch: true,
      })

      expect((await branchStatus('lifecycle'))?.status).toBe('open')
    })

    test('should refuse writes to a closed branch', async () => {
      await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

      await expect(
        payload.create({
          branch: 'lifecycle',
          collection: postsSlug,
          data: { title: 'work after closing' },
        }),
      ).rejects.toThrow()

      await expect(
        payload.update({
          id: mainDocID,
          branch: 'lifecycle',
          collection: postsSlug,
          data: { title: 'edit after closing' },
        }),
      ).rejects.toThrow()

      await expect(
        payload.delete({ id: mainDocID, branch: 'lifecycle', collection: postsSlug }),
      ).rejects.toThrow()

      // Main is untouched by any of the refusals.
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    test('should still allow reading a closed branch', async () => {
      await payload.branches.merge({ branch: 'lifecycle', closeBranch: true })

      // The archive has to remain readable, or the ledger would be unreachable.
      const onBranch = await payload.find({
        branch: 'lifecycle',
        collection: postsSlug,
        pagination: false,
      })

      expect(onBranch.docs.map((doc) => doc.title)).toContain('edited on branch')
    })

    test('should accumulate one ledger entry per merge across a reused branch', async () => {
      await payload.branches.merge({ branch: 'lifecycle' })

      await payload.update({
        id: mainDocID,
        branch: 'lifecycle',
        collection: postsSlug,
        data: { title: 'edited again on branch' },
      })

      await payload.branches.merge({ branch: 'lifecycle' })

      const events = await payload.find({
        collection: branchMergesSlug,
        pagination: false,
        sort: 'mergedAt',
        where: { branch: { equals: 'lifecycle' } },
      })

      expect(events.docs).toHaveLength(2)
    })
  })

  /**
   * Discard is merge's mirror: every operation reduces to dropping the branch's own
   * row, because that row *is* the change.
   */
  test.describe('Discarding changes', () => {
    let mainDocID: number | string
    let createdOnBranchID: number | string

    const pendingChanges = async () =>
      payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'discardwork' } },
      })

    test.beforeEach(async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Discard work', slug: 'discardwork' },
      })

      const doc = await payload.create({
        collection: postsSlug,
        data: { order: 1, title: 'original on main' },
      })

      mainDocID = doc.id

      await payload.update({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
        data: { order: 99, title: 'edited on branch' },
      })

      const created = await payload.create({
        branch: 'discardwork',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      createdOnBranchID = created.id
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchMergesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'discardwork' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    test('should discard every change and restore an open, clean branch', async () => {
      await payload.branches.discard({ branch: 'discardwork' })

      const onBranch = await payload.findByID({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
      })
      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })
      const branchCreatedRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: createdOnBranchID } },
      })
      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { not_equals: 'main' } },
      })
      const branch = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]

      expect(onBranch.title).toBe('original on main')
      expect(onBranch.order).toBe(1)
      expect(onMain.title).toBe('original on main')
      expect(onMain.order).toBe(1)
      expect(branchCreatedRows.docs).toHaveLength(0)
      expect(shadows.docs).toHaveLength(0)
      expect((await pendingChanges()).docs).toHaveLength(0)
      expect(branch?.status).toBe('open')
    })

    test('should refresh the caller request after discarding a change', async () => {
      const req = await createPayloadRequest({ branch: 'discardwork', payload })
      const beforeDiscard = await payload.findByID({ id: mainDocID, collection: postsSlug, req })
      const changes = await pendingChanges()
      const updateChange = changes.docs.find((change) => change.operation === 'update')

      await payload.branches.discard({
        branch: 'discardwork',
        changes: [updateChange!.id],
        overrideAccess: true,
        req,
      })

      const afterDiscard = await payload.findByID({ id: mainDocID, collection: postsSlug, req })

      expect(beforeDiscard.title).toBe('edited on branch')
      expect(afterDiscard.title).toBe('original on main')
    })

    test('should restore a document the branch had deleted', async () => {
      const doomed = await payload.create({
        collection: postsSlug,
        data: { title: 'doomed on main' },
      })

      await payload.delete({ id: doomed.id, branch: 'discardwork', collection: postsSlug })

      const hidden = await payload.find({
        branch: 'discardwork',
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: doomed.id } },
      })

      expect(hidden.docs).toHaveLength(0)

      const changes = await pendingChanges()
      const deleteChange = changes.docs.find((change) => change.operation === 'delete')

      await payload.branches.discard({ branch: 'discardwork', changes: [deleteChange!.id] })

      // Dropping the tombstone un-hides main's document on the branch.
      const restored = await payload.find({
        branch: 'discardwork',
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: doomed.id } },
      })

      expect(restored.docs).toHaveLength(1)
      expect(restored.docs[0]!.title).toBe('doomed on main')
    })

    test('should discard only the selected changes', async () => {
      const changes = await pendingChanges()
      const updateChange = changes.docs.find((change) => change.operation === 'update')

      const result = await payload.branches.discard({
        branch: 'discardwork',
        changes: [updateChange!.id],
      })

      expect(result.discarded).toHaveLength(1)

      // The edit is reverted; the branch-created document is untouched.
      const reverted = await payload.findByID({
        id: mainDocID,
        branch: 'discardwork',
        collection: postsSlug,
      })
      const stillThere = await payload.findByID({
        id: createdOnBranchID,
        branch: 'discardwork',
        collection: postsSlug,
      })

      expect(reverted.title).toBe('original on main')
      expect(stillThere.title).toBe('created on branch')
      expect((await pendingChanges()).docs).toHaveLength(1)
    })

    test('should refuse to discard on a closed branch', async () => {
      await payload.branches.merge({ branch: 'discardwork', closeBranch: true })

      await expect(payload.branches.discard({ branch: 'discardwork' })).rejects.toThrow()
    })

    test('should discard through the REST endpoint', async () => {
      const branchDoc = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]!

      const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.discarded).toHaveLength(2)
      expect((await pendingChanges()).docs).toHaveLength(0)
    })

    test('should reject an unauthenticated discard', async () => {
      const branchDoc = (
        await payload.find({
          collection: branchesSlug,
          pagination: false,
          where: { slug: { equals: 'discardwork' } },
        })
      ).docs[0]!

      const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
        auth: false,
        body: JSON.stringify({}),
      })

      expect([401, 403]).toContain(res.status)
      expect((await pendingChanges()).docs).toHaveLength(2)
    })

    test('should enforce branch delete access in the Local API by default', async () => {
      await expect(
        payload.branches.discard({
          branch: 'discardwork',
          overrideAccess: false,
          user: {
            id: 'restricted-user',
            collection: 'users',
            email: 'restricted@example.com',
          } as never,
        }),
      ).rejects.toThrow()

      expect((await pendingChanges()).docs).toHaveLength(2)
    })
  })

  /**
   * Both merge and discard walk several changes in a loop and must apply either
   * all of them or none of them. A `req` supplied by an HTTP handler must not
   * change that: the transaction is owned by the operation, not by whoever
   * happens to have created the request object.
   */
  test.describe('Transactional integrity', () => {
    let branchSlug: string
    let deleteOneSpy: ReturnType<typeof vi.spyOn> | undefined

    test.afterEach(async () => {
      hookSpy.beforeChange = undefined
      hookSpy.headerBeforeOperation = undefined
      deleteOneSpy?.mockRestore()
      deleteOneSpy = undefined

      for (const collection of [pagesSlug, postsSlug]) {
        const rows = await payload.find({ branch: false, collection, pagination: false })

        for (const row of rows.docs) {
          await payload.delete({ id: row.id, branch: false, collection })
        }
      }

      for (const collection of [branchChangesSlug, branchMergesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: branchSlug } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    test.options(
      'should roll back every change in a non-streaming merge when a later change fails',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        branchSlug = 'txnmerge'

        const branchDoc = await payload.create({
          collection: branchesSlug,
          data: { name: 'Txn merge', slug: branchSlug },
        })

        const a = await payload.create({ collection: postsSlug, data: { title: 'A original' } })
        const b = await payload.create({ collection: postsSlug, data: { title: 'B original' } })
        const c = await payload.create({ collection: postsSlug, data: { title: 'C original' } })

        await payload.update({
          id: a.id,
          branch: 'txnmerge',
          collection: postsSlug,
          data: { title: 'A edited' },
        })
        await payload.update({
          id: b.id,
          branch: 'txnmerge',
          collection: postsSlug,
          data: { title: 'B edited' },
        })
        await payload.update({
          id: c.id,
          branch: 'txnmerge',
          collection: postsSlug,
          data: { title: 'C edited' },
        })

        hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
          if (data.title === 'B edited') {
            throw new Error('Simulated validation failure')
          }
        }

        const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/merge`, {
          body: JSON.stringify({}),
          headers: { Authorization: `JWT ${token}` },
        })

        hookSpy.beforeChange = undefined

        expect(res.status).toBeGreaterThanOrEqual(400)

        const onMainA = await payload.findByID({ id: a.id, collection: postsSlug })
        const onMainB = await payload.findByID({ id: b.id, collection: postsSlug })
        const onMainC = await payload.findByID({ id: c.id, collection: postsSlug })

        // Not "B was rejected but A and C went through" — the batch is one unit.
        expect(onMainA.title).toBe('A original')
        expect(onMainB.title).toBe('B original')
        expect(onMainC.title).toBe('C original')

        const remainingChanges = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'txnmerge' } },
        })
        const mergeEvents = await payload.find({
          collection: branchMergesSlug,
          pagination: false,
          where: { branch: { equals: 'txnmerge' } },
        })
        const mergeEvent = mergeEvents.docs[0] as unknown as {
          changes: { applicationOutcome: string }[]
          status: string
        }

        expect(remainingChanges.docs).toHaveLength(3)
        expect(mergeEvents.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.changes.map(({ applicationOutcome }) => applicationOutcome)).toEqual([
          'rolledBack',
          'failed',
          'unattempted',
        ])
      },
    )

    test('should retain source state when a later non-transactional merge write fails', async () => {
      branchSlug = 'non-transactional-merge'

      await createBranchRecord({ name: 'Non-transactional merge', slug: branchSlug })

      const first = await payload.create({
        collection: postsSlug,
        data: { title: 'First original' },
      })
      const second = await payload.create({
        collection: postsSlug,
        data: { title: 'Second original' },
      })

      await payload.update({
        id: first.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'First edited' },
      })
      await payload.update({
        id: second.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Second edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Second edited') {
          throw new Error('Simulated non-transactional merge failure')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated non-transactional merge failure')

        const sourceRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(sourceRows.docs).toHaveLength(2)
        expect(remainingChanges.docs).toHaveLength(2)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Simulated non-transactional merge failure')
        expect(mergeEvent.changes.map(({ applicationOutcome }) => applicationOutcome)).toEqual([
          'applied',
          'failed',
        ])
        expect(mergeEvent.changes[1]?.error).toContain('Simulated non-transactional merge failure')
      } finally {
        beginTransactionSpy.mockRestore()
      }
    })

    test('should restore an earlier versioned target after a later non-transactional failure', async () => {
      branchSlug = 'non-transactional-version-recovery'

      await createBranchRecord({ name: 'Non-transactional version recovery', slug: branchSlug })
      const versionedDocument = await payload.create({
        collection: pagesSlug,
        data: { title: 'Versioned original' },
      })
      const failingDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Failure original' },
      })

      await payload.update({
        id: versionedDocument.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Versioned edited' },
      })
      await payload.update({
        id: failingDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Failure edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Failure edited') {
          throw new Error('Simulated failure after versioned write')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated failure after versioned write')

        const onMain = await payload.findByID({
          id: versionedDocument.id,
          collection: pagesSlug,
          draft: true,
        })
        const onBranch = await payload.findByID({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          draft: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const recoveredChange = mergeEvent.changes.find(
          ({ collectionSlug }) => collectionSlug === pagesSlug,
        )

        expect(onMain.title).toBe('Versioned original')
        expect(onBranch.title).toBe('Versioned edited')
        expect(remainingChanges.docs).toHaveLength(2)
        expect(mergeEvent.status).toBe('failed')
        expect(recoveredChange).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'restored',
        })
        expect(recoveredChange?.beforeVersionID).toBeTruthy()
        expect(recoveredChange?.afterVersionID).toBeTruthy()
      } finally {
        beginTransactionSpy.mockRestore()
      }
    })

    test('should restore an earlier versioned global after a later non-transactional failure', async () => {
      branchSlug = 'non-transactional-global-version-recovery'

      await createBranchRecord({ name: 'Non-transactional global recovery', slug: branchSlug })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        data: { _status: 'published', heroTitle: 'Global versioned original' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'Global failure original' },
      })
      await payload.updateGlobal({
        slug: homepageGlobalSlug,
        branch: branchSlug,
        data: { heroTitle: 'Global versioned edited' },
        draft: true,
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'Global failure edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

      hookSpy.headerBeforeOperation = () => {
        throw new Error('Simulated failure after versioned global write')
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated failure after versioned global write')

        const onMain = await payload.findGlobal({
          slug: homepageGlobalSlug,
          draft: true,
        })
        const onBranch = await payload.findGlobal({
          slug: homepageGlobalSlug,
          branch: branchSlug,
          draft: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const recoveredChange = mergeEvent.changes.find(
          ({ globalSlug }) => globalSlug === homepageGlobalSlug,
        )

        expect(onMain.heroTitle).toBe('Global versioned original')
        expect(onBranch.heroTitle).toBe('Global versioned edited')
        expect(remainingChanges.docs).toHaveLength(2)
        expect(mergeEvent.status).toBe('failed')
        expect(recoveredChange).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'restored',
        })
        expect(recoveredChange?.beforeVersionID).toBeTruthy()
        expect(recoveredChange?.afterVersionID).toBeTruthy()
      } finally {
        hookSpy.headerBeforeOperation = undefined
        beginTransactionSpy.mockRestore()

        const req = await createPayloadRequest({ branch: false, payload })

        await payload.db.deleteBranchGlobal?.({
          branch: branchSlug,
          globalSlug: homepageGlobalSlug,
          req,
        })
        await payload.db.deleteBranchGlobal?.({
          branch: branchSlug,
          globalSlug: headerGlobalSlug,
          req,
        })
        await payload.updateGlobal({
          slug: homepageGlobalSlug,
          data: { _status: 'published', heroTitle: 'main published' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'main label' },
        })
      }
    })

    test('should remove a branch-created target after a later non-transactional failure', async () => {
      branchSlug = 'non-transactional-create-recovery'

      await createBranchRecord({ name: 'Non-transactional create recovery', slug: branchSlug })
      const createdOnBranch = await payload.create({
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Created on branch' },
      })
      const failingDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Failure original' },
      })

      await payload.update({
        id: failingDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Failure edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Failure edited') {
          throw new Error('Simulated failure after branch create')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated failure after branch create')

        const onMain = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          where: {
            and: [{ id: { equals: createdOnBranch.id } }, { _branch: { equals: 'main' } }],
          },
        })
        const onBranch = await payload.findByID({
          id: createdOnBranch.id,
          branch: branchSlug,
          collection: postsSlug,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const recoveredChange = mergeEvent.changes.find(
          ({ collectionSlug, operation }) => collectionSlug === postsSlug && operation === 'create',
        )

        expect(onMain.docs).toHaveLength(0)
        expect(onBranch.title).toBe('Created on branch')
        expect(remainingChanges.docs).toHaveLength(2)
        expect(mergeEvent.status).toBe('failed')
        expect(recoveredChange).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'deleted',
        })
      } finally {
        beginTransactionSpy.mockRestore()
      }
    })

    test('should record an unknown outcome when application progress cannot be persisted', async () => {
      branchSlug = 'non-transactional-unknown-application'

      await createBranchRecord({ name: 'Non-transactional unknown application', slug: branchSlug })
      const versionedDocument = await payload.create({
        collection: pagesSlug,
        data: { title: 'Unknown application original' },
      })

      await payload.update({
        id: versionedDocument.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Unknown application edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
      const updateOne = payload.db.updateOne.bind(payload.db)
      const updateOneSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
        const changes = (args.data as { changes?: { applicationOutcome?: string }[] }).changes

        if (
          args.collection === branchMergesSlug &&
          changes?.some(({ applicationOutcome }) => applicationOutcome === 'applied')
        ) {
          updateOneSpy.mockImplementation(updateOne)
          throw new Error('Simulated application progress failure')
        }

        return updateOne(args)
      })

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated application progress failure')

        const onMain = await payload.findByID({
          id: versionedDocument.id,
          collection: pagesSlug,
          draft: true,
        })
        const onBranch = await payload.findByID({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          draft: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(onMain.title).toBe('Unknown application edited')
        expect(onBranch.title).toBe('Unknown application edited')
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Simulated application progress failure')
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'unknown',
          recoveryOutcome: 'unknown',
        })
        expect(mergeEvent.changes[0]?.error).toContain('Simulated application progress failure')
      } finally {
        updateOneSpy.mockRestore()
        beginTransactionSpy.mockRestore()
      }
    })

    test('should preserve the merge error when recovery progress cannot be persisted', async () => {
      branchSlug = 'non-transactional-unknown-recovery'

      await createBranchRecord({ name: 'Non-transactional unknown recovery', slug: branchSlug })
      const versionedDocument = await payload.create({
        collection: pagesSlug,
        data: { title: 'Unknown recovery original' },
      })
      const failingDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Unknown recovery failure original' },
      })

      await payload.update({
        id: versionedDocument.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Unknown recovery edited' },
      })
      await payload.update({
        id: failingDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Unknown recovery failure edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
      const updateOne = payload.db.updateOne.bind(payload.db)
      const updateOneSpy = vi.spyOn(payload.db, 'updateOne').mockImplementation(async (args) => {
        const changes = (args.data as { changes?: { recoveryOutcome?: string }[] }).changes

        if (
          args.collection === branchMergesSlug &&
          changes?.some(({ recoveryOutcome }) => recoveryOutcome === 'pending')
        ) {
          updateOneSpy.mockImplementation(updateOne)
          throw new Error('Simulated recovery progress failure')
        }

        return updateOne(args)
      })

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Unknown recovery failure edited') {
          throw new Error('Simulated original merge failure')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated original merge failure')

        const onMain = await payload.findByID({
          id: versionedDocument.id,
          collection: pagesSlug,
          draft: true,
        })
        const onBranch = await payload.findByID({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          draft: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const unresolvedChange = mergeEvent.changes.find(
          ({ collectionSlug }) => collectionSlug === pagesSlug,
        )

        expect(onMain.title).toBe('Unknown recovery edited')
        expect(onBranch.title).toBe('Unknown recovery edited')
        expect(remainingChanges.docs).toHaveLength(2)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Simulated original merge failure')
        expect(unresolvedChange).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'unknown',
        })
        expect(unresolvedChange?.recoveryError).toContain('Simulated recovery progress failure')
      } finally {
        updateOneSpy.mockRestore()
        beginTransactionSpy.mockRestore()
      }
    })

    test('should report recovery as unavailable when the target version was pruned', async () => {
      branchSlug = 'non-transactional-pruned-recovery'

      await createBranchRecord({ name: 'Non-transactional pruned recovery', slug: branchSlug })
      const versionedDocument = await payload.create({
        collection: pagesSlug,
        data: { title: 'Pruned recovery original' },
      })
      const failingDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Pruned recovery failure original' },
      })
      const req = await createPayloadRequest({ branch: false, payload })
      const beforeVersions = await payload.db.findVersions({
        branch: false,
        collection: pagesSlug,
        limit: 1,
        pagination: false,
        req,
        sort: '-updatedAt',
        where: { parent: { equals: versionedDocument.id } },
      })
      const beforeVersionID = beforeVersions.docs[0]!.id

      await payload.update({
        id: versionedDocument.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Pruned recovery edited' },
      })
      await payload.update({
        id: failingDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Pruned recovery failure edited' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

      hookSpy.beforeChange = async ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Pruned recovery failure edited') {
          await payload.db.deleteVersions({
            collection: pagesSlug,
            req,
            where: { id: { equals: beforeVersionID } },
          })
          throw new Error('Simulated failure after pruning the recovery version')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated failure after pruning the recovery version')

        const onMain = await payload.findByID({
          id: versionedDocument.id,
          collection: pagesSlug,
          draft: true,
        })
        const onBranch = await payload.findByID({
          id: versionedDocument.id,
          branch: branchSlug,
          collection: pagesSlug,
          draft: true,
        })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const unresolvedChange = mergeEvent.changes.find(
          ({ collectionSlug }) => collectionSlug === pagesSlug,
        )

        expect(onMain.title).toBe('Pruned recovery edited')
        expect(onBranch.title).toBe('Pruned recovery edited')
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Simulated failure after pruning the recovery version')
        expect(unresolvedChange).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'unavailable',
        })
        expect(unresolvedChange?.recoveryError).toBeUndefined()
      } finally {
        beginTransactionSpy.mockRestore()
      }
    })

    test('should report that recovery restored over an intervening target edit', async () => {
      branchSlug = 'non-transactional-intervening-target-recovery'

      await createBranchRecord({ name: 'Intervening target recovery', slug: branchSlug })
      const versionedDocument = await payload.create({
        collection: pagesSlug,
        data: { title: 'Intervening recovery original' },
      })
      const failingDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Intervening recovery failure original' },
      })

      await payload.update({
        id: versionedDocument.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Intervening recovery branch edit' },
      })
      await payload.update({
        id: failingDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Intervening recovery failure edit' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)

      hookSpy.beforeChange = async ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Intervening recovery failure edit') {
          await payload.update({
            id: versionedDocument.id,
            collection: pagesSlug,
            data: { title: 'Intervening main edit' },
            draft: true,
          })
          throw new Error('Simulated failure after intervening target edit')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated failure after intervening target edit')

        const onMain = await payload.findByID({
          id: versionedDocument.id,
          collection: pagesSlug,
          draft: true,
        })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const recoveredChange = mergeEvent.changes.find(
          ({ collectionSlug }) => collectionSlug === pagesSlug,
        )

        expect(onMain.title).toBe('Intervening recovery original')
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Simulated failure after intervening target edit')
        expect(recoveredChange).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'restored',
        })
      } finally {
        hookSpy.beforeChange = undefined
        beginTransactionSpy.mockRestore()
      }
    })

    test('should retain the original merge error when target recovery fails', async () => {
      branchSlug = 'non-transactional-target-recovery-failure'

      await createBranchRecord({ name: 'Target recovery failure', slug: branchSlug })
      const versionedDocument = await payload.create({
        collection: pagesSlug,
        data: { title: 'Recovery failure original' },
      })
      const failingDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Later failure original' },
      })

      await payload.update({
        id: versionedDocument.id,
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Recovery failure branch edit' },
      })
      await payload.update({
        id: failingDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Later failure branch edit' },
      })

      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
      const restoreVersionSpy = vi
        .spyOn(payload, 'restoreVersion')
        .mockRejectedValueOnce(new Error('Simulated target recovery failure'))

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Later failure branch edit') {
          throw new Error('Simulated original merge failure before recovery')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true }),
        ).rejects.toThrow('Simulated original merge failure before recovery')

        const onMain = await payload.findByID({
          id: versionedDocument.id,
          collection: pagesSlug,
          draft: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })
        const failedRecovery = mergeEvent.changes.find(
          ({ collectionSlug }) => collectionSlug === pagesSlug,
        )

        expect(onMain.title).toBe('Recovery failure branch edit')
        expect(remainingChanges.docs).toHaveLength(2)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Simulated original merge failure before recovery')
        expect(failedRecovery).toMatchObject({
          applicationOutcome: 'applied',
          recoveryOutcome: 'failed',
        })
        expect(failedRecovery?.recoveryError).toContain('Simulated target recovery failure')
      } finally {
        hookSpy.beforeChange = undefined
        restoreVersionSpy.mockRestore()
        beginTransactionSpy.mockRestore()
      }
    })

    test('should retain committed target content when post-commit source cleanup fails', async () => {
      branchSlug = 'post-commit-cleanup-failure'

      await createBranchRecord({ name: 'Post-commit cleanup failure', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Cleanup original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Cleanup edited' },
      })

      const shadow = (
        await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
      ).docs[0]!
      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.where?.id?.equals === shadow.id) {
          throw new Error('Simulated post-commit source cleanup failure')
        }

        return originalDeleteOne(args)
      })

      const result = await payload.branches.merge({
        branch: branchSlug,
        overrideAccess: true,
      })

      expect(result.merged).toHaveLength(1)

      const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
      const sourceRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: branchSlug } },
      })
      const remainingChanges = await findBranchChanges({ branch: branchSlug })
      const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

      expect(onMain.title).toBe('Cleanup edited')
      expect(sourceRows.docs).toHaveLength(1)
      expect(remainingChanges.docs).toHaveLength(1)
      expect(mergeEvent.status).toBe('cleanupFailed')
      expect(mergeEvent.error).toContain('Simulated post-commit source cleanup failure')
      expect(mergeEvent.changes[0]).toMatchObject({
        applicationOutcome: 'committed',
        cleanupOutcome: 'failed',
      })
      expect(mergeEvent.changes[0]?.cleanupError).toContain(
        'Simulated post-commit source cleanup failure',
      )
    })

    test('should retry failed source cleanup without repeating the committed target write', async () => {
      branchSlug = 'post-commit-cleanup-retry'

      await createBranchRecord({ name: 'Post-commit cleanup retry', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Cleanup retry original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Cleanup retry edited' },
      })

      const shadow = (
        await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
      ).docs[0]!
      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
      let cleanupAttempts = 0
      let targetWriteCount = 0

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.where?.id?.equals === shadow.id && cleanupAttempts++ === 0) {
          throw new Error('Simulated retryable source cleanup failure')
        }

        return originalDeleteOne(args)
      })
      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Cleanup retry edited') {
          targetWriteCount += 1
        }
      }

      await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

      expect(targetWriteCount).toBeGreaterThan(0)

      const targetWriteCountAfterFirstMerge = targetWriteCount

      const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

      expect(failedEvent).toMatchObject({
        changes: [
          {
            applicationOutcome: 'committed',
            cleanupOutcome: 'failed',
            sourceID: String(shadow.id),
            sourceUpdatedAt: shadow.updatedAt,
          },
        ],
        status: 'cleanupFailed',
      })

      await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

      const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
      const sourceRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: branchSlug } },
      })
      const remainingChanges = await findBranchChanges({ branch: branchSlug })
      const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

      expect(onMain.title).toBe('Cleanup retry edited')
      expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
      expect(sourceRows.docs).toHaveLength(0)
      expect(remainingChanges.docs).toHaveLength(0)
      expect(mergeEvent.status).toBe('succeeded')
      expect(mergeEvent.error).toBeNull()
      expect(mergeEvent.changes[0]).toMatchObject({
        applicationOutcome: 'committed',
        cleanupOutcome: 'completed',
      })
    })

    test('should preserve newer source work during a failed cleanup retry', async () => {
      branchSlug = 'post-commit-cleanup-retry-newer-source'

      await createBranchRecord({ name: 'Cleanup retry with newer source', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Cleanup retry original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'First merged source' },
      })

      const shadow = (
        await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
      ).docs[0]!
      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
      let cleanupAttempts = 0

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.where?.id?.equals === shadow.id && cleanupAttempts++ === 0) {
          throw new Error('Simulated source cleanup failure before newer work')
        }

        return originalDeleteOne(args)
      })

      await payload.branches.merge({ branch: branchSlug, overrideAccess: true })
      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Newer source work' },
      })

      const retryResult = await payload.branches.merge({
        branch: branchSlug,
        overrideAccess: true,
      })
      const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
      const onBranch = await payload.findByID({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
      })
      const sourceRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: branchSlug } },
      })
      const remainingChanges = await findBranchChanges({ branch: branchSlug })
      const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

      expect(retryResult.merged).toHaveLength(0)
      expect(onMain.title).toBe('First merged source')
      expect(onBranch.title).toBe('Newer source work')
      expect(sourceRows.docs).toHaveLength(1)
      expect(remainingChanges.docs).toHaveLength(1)
      expect(mergeEvent.status).toBe('succeeded')
      expect(mergeEvent.error).toBeNull()
      expect(mergeEvent.changes[0]).toMatchObject({
        applicationOutcome: 'committed',
        cleanupOutcome: 'superseded',
      })
    })

    test('should retry branch-created version cleanup without repeating the target write', async () => {
      branchSlug = 'post-commit-created-version-cleanup-retry'

      await createBranchRecord({ name: 'Branch-created version cleanup retry', slug: branchSlug })
      const createdOnBranch = await payload.create({
        branch: branchSlug,
        collection: pagesSlug,
        data: { title: 'Created version cleanup retry' },
      })
      const beginTransactionSpy = vi.spyOn(payload.db, 'beginTransaction').mockResolvedValue(null)
      const originalDeleteVersions = payload.db.deleteVersions.bind(payload.db)
      let sourceVersionCleanupAttempts = 0
      let targetWriteCount = 0
      const deleteVersionsSpy = vi
        .spyOn(payload.db, 'deleteVersions')
        .mockImplementation(async (args) => {
          if (args.collection === pagesSlug && sourceVersionCleanupAttempts++ === 0) {
            throw new Error('Simulated branch-created source version cleanup failure')
          }

          return originalDeleteVersions(args)
        })

      hookSpy.pageBeforeChange = () => {
        targetWriteCount += 1
      }

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

        const targetWriteCountAfterFirstMerge = targetWriteCount
        const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(failedEvent.status).toBe('cleanupFailed')
        expect(failedEvent.changes[0]?.sourceVersionIDs?.length).toBeGreaterThan(0)

        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const onMain = await payload.findByID({
          id: createdOnBranch.id,
          collection: pagesSlug,
          draft: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

        expect(retryResult.merged).toHaveLength(1)
        expect(onMain.title).toBe('Created version cleanup retry')
        expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
        expect(remainingChanges.docs).toHaveLength(0)
        expect(eventAfterRetry.status).toBe('succeeded')
        expect(eventAfterRetry.error).toBeNull()
        expect(eventAfterRetry.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'completed',
        })
      } finally {
        hookSpy.pageBeforeChange = undefined
        deleteVersionsSpy.mockRestore()
        beginTransactionSpy.mockRestore()
      }
    })

    test('should retry failed deletion-marker cleanup without repeating the deletion', async () => {
      branchSlug = 'post-commit-deletion-cleanup-failure'

      await createBranchRecord({ name: 'Post-commit deletion cleanup failure', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Delete after commit' },
      })

      await payload.delete({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
      })

      const deletionMarker = (
        await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
      ).docs[0]!
      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
      let cleanupAttempts = 0

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.where?.id?.equals === deletionMarker.id && cleanupAttempts++ === 0) {
          throw new Error('Simulated deletion-marker cleanup failure')
        }

        return originalDeleteOne(args)
      })

      const result = await payload.branches.merge({
        branch: branchSlug,
        overrideAccess: true,
      })

      const onMain = await payload.find({
        collection: postsSlug,
        pagination: false,
        where: { id: { equals: mainDocument.id } },
      })
      const sourceRows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: branchSlug } },
      })
      const remainingChanges = await findBranchChanges({ branch: branchSlug })
      const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

      expect(result.merged).toHaveLength(1)
      expect(onMain.docs).toHaveLength(0)
      expect(sourceRows.docs).toHaveLength(1)
      expect(remainingChanges.docs).toHaveLength(1)
      expect(mergeEvent.status).toBe('cleanupFailed')
      expect(mergeEvent.changes[0]).toMatchObject({
        applicationOutcome: 'committed',
        cleanupOutcome: 'failed',
      })

      const retryResult = await payload.branches.merge({
        branch: branchSlug,
        overrideAccess: true,
      })
      const sourceRowsAfterRetry = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: { _branch: { equals: branchSlug } },
      })
      const changesAfterRetry = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branchSlug } },
      })
      const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

      expect(retryResult.merged).toHaveLength(1)
      expect(sourceRowsAfterRetry.docs).toHaveLength(0)
      expect(changesAfterRetry.docs).toHaveLength(0)
      expect(eventAfterRetry.status).toBe('succeeded')
      expect(eventAfterRetry.error).toBeNull()
      expect(eventAfterRetry.changes[0]).toMatchObject({
        applicationOutcome: 'committed',
        cleanupOutcome: 'completed',
      })
    })

    test('should retry failed global cleanup without repeating the committed target write', async () => {
      branchSlug = 'post-commit-global-cleanup-failure'

      await createBranchRecord({ name: 'Post-commit global cleanup failure', slug: branchSlug })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'Global cleanup original' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'Global cleanup edited' },
      })

      const deleteBranchGlobalSpy = vi
        .spyOn(payload.db, 'deleteBranchGlobal')
        .mockRejectedValueOnce(new Error('Simulated global source cleanup failure'))
      let targetWriteCount = 0

      hookSpy.headerBeforeOperation = () => {
        targetWriteCount += 1
      }

      try {
        const result = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const onMain = await payload.findGlobal({ slug: headerGlobalSlug })
        const onBranch = await payload.findGlobal({ branch: branchSlug, slug: headerGlobalSlug })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(result.merged).toHaveLength(1)
        expect(onMain.navLabel).toBe('Global cleanup edited')
        expect(onBranch.navLabel).toBe('Global cleanup edited')
        expect(remainingChanges.docs).toHaveLength(1)
        expect(failedEvent.status).toBe('cleanupFailed')
        expect(failedEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'failed',
        })
        expect(failedEvent.changes[0]?.sourceRevision).toBeTruthy()

        const targetWriteCountAfterFirstMerge = targetWriteCount
        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const changesAfterRetry = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        })
        const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

        expect(retryResult.merged).toHaveLength(1)
        expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
        expect(changesAfterRetry.docs).toHaveLength(0)
        expect(eventAfterRetry.status).toBe('succeeded')
        expect(eventAfterRetry.error).toBeNull()
        expect(eventAfterRetry.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'completed',
        })
      } finally {
        deleteBranchGlobalSpy.mockRestore()

        await payload.db.deleteBranchGlobal?.({
          branch: branchSlug,
          globalSlug: headerGlobalSlug,
          req: await createPayloadRequest({ branch: false, payload }),
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'main label' },
        })
      }
    })

    test('should preserve newer global source work during a failed cleanup retry', async () => {
      branchSlug = 'post-commit-global-cleanup-newer-source'

      await createBranchRecord({ name: 'Global cleanup retry with newer source', slug: branchSlug })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'Global cleanup retry original' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'First global merged source' },
      })

      const deleteBranchGlobalSpy = vi
        .spyOn(payload.db, 'deleteBranchGlobal')
        .mockRejectedValueOnce(new Error('Simulated global cleanup failure before newer work'))

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
          data: { navLabel: 'Newer global source work' },
        })

        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const onMain = await payload.findGlobal({ slug: headerGlobalSlug })
        const onBranch = await payload.findGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(retryResult.merged).toHaveLength(0)
        expect(onMain.navLabel).toBe('First global merged source')
        expect(onBranch.navLabel).toBe('Newer global source work')
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('succeeded')
        expect(mergeEvent.error).toBeNull()
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'superseded',
        })
      } finally {
        deleteBranchGlobalSpy.mockRestore()

        await payload.db.deleteBranchGlobal?.({
          branch: branchSlug,
          globalSlug: headerGlobalSlug,
          req: await createPayloadRequest({ branch: false, payload }),
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'main label' },
        })
      }
    })

    test('should batch registry cleanup after ordered target lifecycle writes', async () => {
      branchSlug = 'batched-registry-cleanup'

      await createBranchRecord({ name: 'Batched registry cleanup', slug: branchSlug })
      const firstDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Batch cleanup first original' },
      })
      const secondDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Batch cleanup second original' },
      })

      await payload.update({
        id: firstDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Batch cleanup first edited' },
      })
      await payload.update({
        id: secondDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Batch cleanup second edited' },
      })

      const pendingChanges = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        sort: 'createdAt',
        where: { branch: { equals: branchSlug } },
      })
      const batchProcessing = payload.db.batchProcessing.bind(payload.db)
      const batchProcessingSpy = vi
        .spyOn(payload.db, 'batchProcessing')
        .mockImplementation((args) => batchProcessing(args))
      const targetHookTitles: string[] = []
      let earlierTitleObservedBySecondHook: string | undefined

      hookSpy.beforeChange = async ({
        data,
        req,
      }: {
        data: Record<string, unknown>
        req: PayloadRequest
      }) => {
        if (typeof data.title === 'string') {
          targetHookTitles.push(data.title)
        }

        if (data.title === 'Batch cleanup second edited') {
          const earlierTarget = await payload.findByID({
            id: firstDocument.id,
            collection: postsSlug,
            req,
          })

          earlierTitleObservedBySecondHook = earlierTarget.title
        }
      }

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true })

        expect(batchProcessingSpy).toHaveBeenCalledWith({
          operations: pendingChanges.docs.map(({ id }) => ({
            args: {
              branch: false,
              collection: branchChangesSlug,
              returning: false,
              where: { id: { equals: id } },
            },
            operation: 'deleteOne',
          })),
          req: expect.any(Object),
        })
        expect(targetHookTitles.indexOf('Batch cleanup first edited')).toBeLessThan(
          targetHookTitles.indexOf('Batch cleanup second edited'),
        )
        expect(earlierTitleObservedBySecondHook).toBe('Batch cleanup first edited')

        const onMain = await payload.find({
          collection: postsSlug,
          pagination: false,
          sort: 'createdAt',
          where: { id: { in: [firstDocument.id, secondDocument.id] } },
        })

        expect(onMain.docs.map(({ title }) => title)).toEqual([
          'Batch cleanup first edited',
          'Batch cleanup second edited',
        ])
      } finally {
        batchProcessingSpy.mockRestore()
      }
    })

    test('should preserve failed and unattempted outcomes from registry cleanup batches', async () => {
      branchSlug = 'partial-registry-cleanup-batch'

      await createBranchRecord({ name: 'Partial registry cleanup batch', slug: branchSlug })
      const firstDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Partial batch first original' },
      })
      const secondDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Partial batch second original' },
      })

      await payload.update({
        id: firstDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Partial batch first edited' },
      })
      await payload.update({
        id: secondDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Partial batch second edited' },
      })

      const deleteOne = payload.db.deleteOne.bind(payload.db)
      let hasFailedRegistryDelete = false
      const registryDeleteSpy = vi
        .spyOn(payload.db, 'deleteOne')
        .mockImplementation(async (args) => {
          if (args.collection === branchChangesSlug && !hasFailedRegistryDelete) {
            hasFailedRegistryDelete = true
            throw new Error('Simulated registry cleanup operation failure')
          }

          return deleteOne(args)
        })

      try {
        const result = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const remainingChanges = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          sort: 'createdAt',
          where: { branch: { equals: branchSlug } },
        })
        const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(result.merged).toHaveLength(2)
        expect(remainingChanges.docs).toHaveLength(2)
        expect(failedEvent.status).toBe('cleanupFailed')
        expect(failedEvent.changes).toMatchObject([
          {
            cleanupError: 'Simulated registry cleanup operation failure',
            cleanupOutcome: 'failed',
          },
          {
            cleanupError: 'Branch change registry cleanup was not attempted.',
            cleanupOutcome: 'failed',
          },
        ])

        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const changesAfterRetry = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        })

        expect(retryResult.merged).toHaveLength(2)
        expect(changesAfterRetry.docs).toHaveLength(0)
      } finally {
        registryDeleteSpy.mockRestore()
      }
    })

    test('should retry a rejected registry cleanup batch without repeating target writes', async () => {
      branchSlug = 'rejected-registry-cleanup-batch'

      await createBranchRecord({ name: 'Rejected registry cleanup batch', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Rejected batch original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Rejected batch edited' },
      })

      const batchProcessing = payload.db.batchProcessing.bind(payload.db)
      const batchProcessingSpy = vi
        .spyOn(payload.db, 'batchProcessing')
        .mockRejectedValueOnce(new Error('Simulated registry cleanup batch rejection'))
        .mockImplementation((args) => batchProcessing(args))
      let targetWriteCount = 0

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Rejected batch edited') {
          targetWriteCount += 1
        }
      }

      try {
        const firstResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const targetWriteCountAfterFirstMerge = targetWriteCount
        const failedEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(firstResult.merged).toHaveLength(1)
        expect(failedEvent.status).toBe('cleanupFailed')
        expect(failedEvent.error).toContain('Simulated registry cleanup batch rejection')
        expect(failedEvent.changes[0]).toMatchObject({
          cleanupError: 'Simulated registry cleanup batch rejection',
          cleanupOutcome: 'failed',
        })

        const retryResult = await payload.branches.merge({
          branch: branchSlug,
          overrideAccess: true,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const eventAfterRetry = await findBranchMergeEvent({ branch: branchSlug })

        expect(retryResult.merged).toHaveLength(1)
        expect(targetWriteCount).toBe(targetWriteCountAfterFirstMerge)
        expect(remainingChanges.docs).toHaveLength(0)
        expect(eventAfterRetry.status).toBe('succeeded')
        expect(eventAfterRetry.error).toBeNull()
        expect(eventAfterRetry.changes[0]).toMatchObject({ cleanupOutcome: 'completed' })
      } finally {
        hookSpy.beforeChange = undefined
        batchProcessingSpy.mockRestore()
      }
    })

    test.options(
      'should roll back every change in a discard when a later change fails',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        branchSlug = 'txndiscard'

        const branchDoc = await payload.create({
          collection: branchesSlug,
          data: { name: 'Txn discard', slug: branchSlug },
        })

        const a = await payload.create({ collection: postsSlug, data: { title: 'A original' } })
        const b = await payload.create({ collection: postsSlug, data: { title: 'B original' } })
        const c = await payload.create({ collection: postsSlug, data: { title: 'C original' } })

        await payload.update({
          id: a.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'A edited' },
        })
        await payload.update({
          id: b.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'B edited' },
        })
        await payload.update({
          id: c.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'C edited' },
        })

        const shadowRows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })

        const bShadow = shadowRows.docs.find((row) => String(row._branchDocID) === String(b.id))!

        const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

        deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
          if (args?.where?.id?.equals === bShadow.id) {
            throw new Error('Simulated database failure')
          }

          return originalDeleteOne(args)
        })

        const res = await restClient.POST(`/${branchesSlug}/${branchDoc.id}/discard`, {
          body: JSON.stringify({}),
          headers: { Authorization: `JWT ${token}` },
        })

        expect(res.status).toBeGreaterThanOrEqual(400)

        // A's shadow row was already dropped by the time B failed — the whole
        // batch is one transaction, so that drop must be undone too.
        const onBranchA = await payload.findByID({
          id: a.id,
          branch: branchSlug,
          collection: postsSlug,
        })

        expect(onBranchA.title).toBe('A edited')

        const remainingChanges = await findBranchChanges({ branch: branchSlug })

        expect(remainingChanges.docs).toHaveLength(3)
      },
    )

    test('should leave a caller-owned transaction open when merge fails', async () => {
      branchSlug = 'caller-owned-merge'

      await createBranchRecord({ name: 'Caller-owned merge', slug: branchSlug })
      const mainDoc = await payload.create({
        collection: postsSlug,
        data: { title: 'Caller-owned original' },
      })

      await payload.update({
        id: mainDoc.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Caller-owned edited' },
      })

      const req = await createPayloadRequest({ branch: false, payload })
      req.transactionID = 'caller-owned-merge-transaction'
      const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

      hookSpy.beforeChange = ({ data }: { data: Record<string, unknown> }) => {
        if (data.title === 'Caller-owned edited') {
          throw new Error('Simulated caller-owned merge failure')
        }
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true, req }),
        ).rejects.toThrow('Simulated caller-owned merge failure')

        expect(rollbackTransactionSpy).not.toHaveBeenCalled()
        expect(req.transactionID).toBe('caller-owned-merge-transaction')
      } finally {
        hookSpy.beforeChange = undefined
        rollbackTransactionSpy.mockRestore()
        delete req.transactionID
      }
    })

    test('should finalise a successful merge only after its caller-owned transaction commits', async () => {
      branchSlug = 'caller-owned-successful-merge'

      await createBranchRecord({ name: 'Caller-owned successful merge', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Caller-owned success original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Caller-owned success edited' },
      })

      const req = await createPayloadRequest({ branch: false, payload })

      expect(await initTransaction(req)).toBe(true)

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })

        const beforeCommit = await findBranchMergeEvent({ branch: branchSlug })

        expect(beforeCommit.status).toBe('awaitingCommit')
        expect(beforeCommit.changes[0]?.applicationOutcome).toBe('applied')
        expect(beforeCommit.changes[0]?.cleanupOutcome).toBe('pending')

        await commitTransaction(req)

        const afterCommit = await findBranchMergeEvent({ branch: branchSlug })

        expect(afterCommit.status).toBe('succeeded')
        expect(afterCommit.changes[0]?.applicationOutcome).toBe('committed')
        expect(afterCommit.changes[0]?.cleanupOutcome).toBe('completed')
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    })

    test('should preserve newer source work created before caller-owned cleanup', async () => {
      branchSlug = 'caller-owned-newer-source-work'

      await createBranchRecord({ name: 'Caller-owned newer source work', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Newer source original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Merge candidate' },
      })

      const req = await createPayloadRequest({ branch: false, payload })

      expect(await initTransaction(req)).toBe(true)

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })

        await payload.update({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
          data: { title: 'Newer branch work' },
        })

        await commitTransaction(req)

        const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
        const onBranch = await payload.findByID({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(onMain.title).toBe('Merge candidate')
        expect(onBranch.title).toBe('Newer branch work')
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('succeeded')
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'superseded',
        })
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    })

    test('should preserve newer global work created before caller-owned cleanup', async () => {
      branchSlug = 'caller-owned-newer-global-work'

      await createBranchRecord({ name: 'Caller-owned newer global work', slug: branchSlug })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'Global source original' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'Global merge candidate' },
      })

      const req = await createPayloadRequest({ branch: false, payload })

      expect(await initTransaction(req)).toBe(true)

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })

        await payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branchSlug,
          data: { navLabel: 'Newer global branch work' },
        })

        await commitTransaction(req)

        const onMain = await payload.findGlobal({ slug: headerGlobalSlug })
        const onBranch = await payload.findGlobal({ branch: branchSlug, slug: headerGlobalSlug })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(onMain.navLabel).toBe('Global merge candidate')
        expect(onBranch.navLabel).toBe('Newer global branch work')
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('succeeded')
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'committed',
          cleanupOutcome: 'superseded',
        })
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }

        await payload.db.deleteBranchGlobal?.({
          branch: branchSlug,
          globalSlug: headerGlobalSlug,
          req: await createPayloadRequest({ branch: false, payload }),
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'main label' },
        })
      }
    })

    test('should record a successful merge as rolled back when its caller-owned transaction rolls back', async () => {
      branchSlug = 'caller-owned-rolled-back-merge'

      await createBranchRecord({ name: 'Caller-owned rolled-back merge', slug: branchSlug })
      const mainDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'Caller-owned rollback original' },
      })

      await payload.update({
        id: mainDocument.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Caller-owned rollback edited' },
      })

      const req = await createPayloadRequest({ branch: false, payload })

      expect(await initTransaction(req)).toBe(true)

      try {
        await payload.branches.merge({ branch: branchSlug, overrideAccess: true, req })
        await killTransaction(req)

        const onMain = await payload.findByID({ id: mainDocument.id, collection: postsSlug })
        const onBranch = await payload.findByID({
          id: mainDocument.id,
          branch: branchSlug,
          collection: postsSlug,
        })
        const remainingChanges = await findBranchChanges({ branch: branchSlug })
        const mergeEvent = await findBranchMergeEvent({ branch: branchSlug })

        expect(onMain.title).toBe('Caller-owned rollback original')
        expect(onBranch.title).toBe('Caller-owned rollback edited')
        expect(remainingChanges.docs).toHaveLength(1)
        expect(mergeEvent.status).toBe('failed')
        expect(mergeEvent.error).toContain('Caller-owned transaction rolled back')
        expect(mergeEvent.changes[0]).toMatchObject({
          applicationOutcome: 'rolledBack',
          cleanupOutcome: 'pending',
        })
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    })

    test('should leave a caller-owned transaction open when discard fails', async () => {
      branchSlug = 'caller-owned-discard'

      await createBranchRecord({ name: 'Caller-owned discard', slug: branchSlug })
      const mainDoc = await payload.create({
        collection: postsSlug,
        data: { title: 'Caller-owned original' },
      })

      await payload.update({
        id: mainDoc.id,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'Caller-owned edited' },
      })

      const shadow = (
        await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: { _branch: { equals: branchSlug } },
        })
      ).docs[0]!
      const req = await createPayloadRequest({ branch: false, payload })
      req.transactionID = 'caller-owned-discard-transaction'
      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.where?.id?.equals === shadow.id) {
          throw new Error('Simulated caller-owned discard failure')
        }

        return originalDeleteOne(args)
      })

      const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

      try {
        await expect(
          payload.branches.discard({ branch: branchSlug, overrideAccess: true, req }),
        ).rejects.toThrow('Simulated caller-owned discard failure')

        expect(rollbackTransactionSpy).not.toHaveBeenCalled()
        expect(req.transactionID).toBe('caller-owned-discard-transaction')
      } finally {
        rollbackTransactionSpy.mockRestore()
        delete req.transactionID
      }
    })

    test('should leave a caller-owned transaction open when a global merge fails', async () => {
      branchSlug = 'caller-owned-global-merge'

      await createBranchRecord({ name: 'Caller-owned global merge', slug: branchSlug })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'Caller-owned global original' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branchSlug,
        data: { navLabel: 'Caller-owned global edited' },
      })

      const req = await createPayloadRequest({ branch: false, payload })
      req.transactionID = 'caller-owned-global-merge-transaction'
      const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

      hookSpy.headerBeforeOperation = () => {
        throw new Error('Simulated caller-owned global merge failure')
      }

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true, req }),
        ).rejects.toThrow('Simulated caller-owned global merge failure')

        expect(rollbackTransactionSpy).not.toHaveBeenCalled()
        expect(req.transactionID).toBe('caller-owned-global-merge-transaction')
      } finally {
        hookSpy.headerBeforeOperation = undefined
        rollbackTransactionSpy.mockRestore()
        delete req.transactionID

        await payload.db.deleteBranchGlobal?.({
          branch: branchSlug,
          globalSlug: headerGlobalSlug,
          req: await createPayloadRequest({ branch: false, payload }),
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: { navLabel: 'main label' },
        })
      }
    })

    test('should leave a caller-owned transaction open when a delete merge fails', async () => {
      branchSlug = 'caller-owned-delete-merge'

      await createBranchRecord({ name: 'Caller-owned delete merge', slug: branchSlug })
      const mainDoc = await payload.create({
        collection: postsSlug,
        data: { title: 'Caller-owned delete original' },
      })

      await payload.delete({ id: mainDoc.id, branch: branchSlug, collection: postsSlug })

      const req = await createPayloadRequest({ branch: false, payload })
      req.transactionID = 'caller-owned-delete-merge-transaction'
      const originalDeleteOne = payload.db.deleteOne.bind(payload.db)

      deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args: any) => {
        if (args?.collection === postsSlug && args?.where?.id?.equals === mainDoc.id) {
          throw new Error('Simulated caller-owned delete merge failure')
        }

        return originalDeleteOne(args)
      })

      const rollbackTransactionSpy = vi.spyOn(payload.db, 'rollbackTransaction')

      try {
        await expect(
          payload.branches.merge({ branch: branchSlug, overrideAccess: true, req }),
        ).rejects.toThrow('Simulated caller-owned delete merge failure')

        expect(rollbackTransactionSpy).not.toHaveBeenCalled()
        expect(req.transactionID).toBe('caller-owned-delete-merge-transaction')
      } finally {
        rollbackTransactionSpy.mockRestore()
        delete req.transactionID
      }
    })
  })

  /**
   * `forkDocument` (and the tombstone path in `resolveBranchDelete`) check
   * whether the branch already has a shadow row, then create one if not. Two
   * concurrent first-edits of the same document on the same branch can both
   * pass that check before either write lands, each creating its own row.
   */
  test.describe('Fork race safety', () => {
    test.afterEach(async () => {
      hookSpy.postAfterDelete = undefined
      hookSpy.postBeforeOperation = undefined

      await payload.db.deleteBranchGlobal?.({
        branch: 'racebranch',
        globalSlug: headerGlobalSlug,
        req: await createPayloadRequest({ branch: false, payload }),
      })

      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      const hookWriteRows = await payload.find({
        collection: excludedSlug,
        pagination: false,
        where: { title: { contains: 'race hook ' } },
      })

      for (const row of hookWriteRows.docs) {
        await payload.delete({ id: row.id, collection: excludedSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'racebranch' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    test('should create exactly one shadow row when two edits race to fork the same document', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })

      const doc = await payload.create({ collection: postsSlug, data: { title: 'racer' } })
      const hookAttempts = new Map<string, number>()
      const requestStateAtAttemptStart: {
        context: unknown
        query: unknown
        routeParams: unknown
      }[] = []
      const create = payload.db.create.bind(payload.db)
      let releaseShadowCreates!: () => void
      let waitingShadowCreates = 0
      const shadowCreatesReady = new Promise<void>((resolve) => {
        releaseShadowCreates = resolve
      })
      const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
        if (
          args.collection === postsSlug &&
          args.data?._branch === 'racebranch' &&
          String(args.data?._branchDocID) === String(doc.id)
        ) {
          waitingShadowCreates += 1

          if (waitingShadowCreates === 2) {
            releaseShadowCreates()
          }

          await shadowCreatesReady
        }

        return create(args)
      })

      hookSpy.postBeforeOperation = async ({ args, req }) => {
        const title = args.data?.title

        if (
          typeof title !== 'string' ||
          (!title.startsWith('edit A') && !title.startsWith('edit B'))
        ) {
          return
        }

        const operationTitle = title.replace(/!+$/, '')

        hookAttempts.set(operationTitle, (hookAttempts.get(operationTitle) ?? 0) + 1)
        requestStateAtAttemptStart.push({
          context: req.context.raceMutation,
          query: req.query.raceMutation,
          routeParams: req.routeParams?.raceMutation,
        })
        args.data!.title = `${title}!`
        req.context.raceMutation = operationTitle
        req.query.raceMutation = operationTitle
        req.routeParams ??= {}
        req.routeParams.raceMutation = operationTitle

        await req.payload.db.create({
          collection: excludedSlug,
          data: { title: `race hook ${operationTitle}` },
          req,
        })
      }

      try {
        await Promise.all([
          payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'edit A' },
          }),
          payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'edit B' },
          }),
        ])
      } finally {
        releaseShadowCreates()
        createSpy.mockRestore()
      }

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
        },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(['edit A!', 'edit B!']).toContain(shadows.docs[0]!.title)
      expect(expectedConcurrentOperationAttemptCounts).toContainEqual(
        [...hookAttempts.values()].sort(),
      )

      for (const requestState of requestStateAtAttemptStart) {
        expect(requestState).toEqual({
          context: undefined,
          query: undefined,
          routeParams: undefined,
        })
      }

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)

      const hookWrites = await payload.find({
        collection: excludedSlug,
        pagination: false,
        where: { title: { contains: 'race hook ' } },
      })

      expect(hookWrites.docs.map(({ title }) => title).sort()).toEqual([
        'race hook edit A',
        'race hook edit B',
      ])
    })

    test.options(
      'should retry a first branch edit when its final transaction commit is transient',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({ collection: postsSlug, data: { title: 'commit racer' } })
        const commitTransaction = payload.db.commitTransaction.bind(payload.db)
        const commitError = Object.assign(new Error('Simulated first final commit conflict'), {
          errorLabels: ['TransientTransactionError'],
        })
        let hookAttempts = 0
        let commitAttempts = 0

        hookSpy.postBeforeOperation = async ({ args, req }) => {
          if (typeof args.data?.title !== 'string' || !args.data.title.startsWith('commit retry')) {
            return
          }

          hookAttempts += 1
          args.data.title = `${args.data.title}!`

          await req.payload.db.create({
            collection: excludedSlug,
            data: { title: 'race hook final commit' },
            req,
          })
        }

        const commitSpy = vi
          .spyOn(payload.db, 'commitTransaction')
          .mockImplementation(async (transactionID) => {
            commitAttempts += 1

            if (commitAttempts === 1) {
              throw commitError
            }

            return commitTransaction(transactionID)
          })

        try {
          const result = await payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'commit retry' },
          })

          expect(result.title).toBe('commit retry!')
        } finally {
          commitSpy.mockRestore()
        }

        expect(commitAttempts).toBe(2)
        expect(hookAttempts).toBe(2)

        const hookWrites = await payload.find({
          collection: excludedSlug,
          pagination: false,
          where: { title: { equals: 'race hook final commit' } },
        })

        expect(hookWrites.docs).toHaveLength(1)
      },
    )

    test('should create exactly one global row when first writes race', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })
      await payload.updateGlobal({
        slug: headerGlobalSlug,
        data: { navLabel: 'main before race' },
      })

      await Promise.all(
        Array.from({ length: 10 }, (_, index) =>
          payload.updateGlobal({
            slug: headerGlobalSlug,
            branch: 'racebranch',
            data: { navLabel: `race edit ${index}` },
          }),
        ),
      )

      const adapter = payload.db as any
      const branchRows =
        adapter.name === 'mongoose'
          ? await adapter.globals
              .find({ _branch: 'racebranch', globalType: headerGlobalSlug })
              .lean()
          : (
              await adapter.drizzle.query[adapter.tableNameMap.get(headerGlobalSlug)].findMany()
            ).filter((row: Record<string, unknown>) => row._branch === 'racebranch')

      expect(branchRows).toHaveLength(1)

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)
    })

    test.options(
      'should preserve disjoint scalar global changes when first writes race',
      { db: 'drizzle' },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })
        await payload.updateGlobal({
          slug: headerGlobalSlug,
          data: {
            navigationBlocks: [{ blockType: 'navigation-block', label: 'main navigation block' }],
            navItems: [{ label: 'main item' }],
            navLabel: 'main label',
            secondaryLabel: 'main secondary',
          },
        })

        const updateGlobal = payload.db.updateGlobal.bind(payload.db)
        let releaseWrites!: () => void
        const writesReady = new Promise<void>((resolve) => {
          releaseWrites = resolve
        })
        let waitingWrites = 0
        const updateGlobalSpy = vi
          .spyOn(payload.db, 'updateGlobal')
          .mockImplementation(async (args) => {
            waitingWrites += 1
            if (waitingWrites === 2) {
              releaseWrites()
            }

            await writesReady

            return updateGlobal(args)
          })

        try {
          await Promise.all([
            payload.updateGlobal({
              slug: headerGlobalSlug,
              branch: 'racebranch',
              data: { navLabel: 'branch label' },
            }),
            payload.updateGlobal({
              slug: headerGlobalSlug,
              branch: 'racebranch',
              data: { secondaryLabel: 'branch secondary' },
            }),
          ])
        } finally {
          updateGlobalSpy.mockRestore()
        }

        const onBranch = await payload.findGlobal({
          slug: headerGlobalSlug,
          branch: 'racebranch',
        })

        expect(onBranch).toMatchObject({
          navigationBlocks: [{ blockType: 'navigation-block', label: 'main navigation block' }],
          navItems: [{ label: 'main item' }],
          navLabel: 'branch label',
          secondaryLabel: 'branch secondary',
        })
      },
    )

    test.options(
      'should roll back a first branch tombstone when an afterDelete hook fails',
      { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({ collection: postsSlug, data: { title: 'hook failure' } })
        const hookError = new Error('Simulated afterDelete failure')

        hookSpy.postAfterDelete = () => {
          throw hookError
        }

        try {
          await expect(
            payload.delete({ id: doc.id, branch: 'racebranch', collection: postsSlug }),
          ).rejects.toBe(hookError)
        } finally {
          hookSpy.postAfterDelete = undefined
        }

        const shadows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'racebranch' } },
        })
        const onBranch = await payload.findByID({
          id: doc.id,
          branch: 'racebranch',
          collection: postsSlug,
        })

        expect(shadows.docs).toHaveLength(0)
        expect(changes.docs).toHaveLength(0)
        expect(onBranch.title).toBe('hook failure')
      },
    )

    test.options(
      'should reject a first branch delete inside a caller-owned transaction',
      { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({
          collection: postsSlug,
          data: { title: 'caller delete' },
        })
        const req = await createPayloadRequest({ branch: 'racebranch', payload })
        const didStartTransaction = await initTransaction(req)
        const callerTransactionID = await req.transactionID

        expect(didStartTransaction).toBe(true)

        try {
          await expect(
            payload.delete({
              id: doc.id,
              branch: 'racebranch',
              collection: postsSlug,
              req,
            }),
          ).rejects.toMatchObject({
            message: 'Cannot delete an untouched branch document within an existing transaction.',
            status: 409,
          })

          expect(req.transactionID).toBe(callerTransactionID)

          const shadows = await payload.find({
            branch: false,
            collection: postsSlug,
            pagination: false,
            showHiddenFields: true,
            where: {
              and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
            },
          })
          const changes = await payload.find({
            collection: branchChangesSlug,
            pagination: false,
            where: { branch: { equals: 'racebranch' } },
          })

          expect(shadows.docs).toHaveLength(0)
          expect(changes.docs).toHaveLength(0)
        } finally {
          if (req.transactionID) {
            await killTransaction(req)
          }
        }
      },
    )

    test('should create exactly one tombstone when two deletes race to remove the same never-forked document', async () => {
      await payload.create({
        collection: branchesSlug,
        data: { name: 'Race', slug: 'racebranch' },
      })

      const doc = await payload.create({ collection: postsSlug, data: { title: 'doomed' } })
      const deleteHookAttempts = new Map<string, number>()
      const create = payload.db.create.bind(payload.db)
      let releaseShadowCreates!: () => void
      let waitingShadowCreates = 0
      const shadowCreatesReady = new Promise<void>((resolve) => {
        releaseShadowCreates = resolve
      })
      const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
        if (
          args.collection === postsSlug &&
          args.data?._branch === 'racebranch' &&
          String(args.data?._branchDocID) === String(doc.id)
        ) {
          waitingShadowCreates += 1

          if (waitingShadowCreates === 2) {
            releaseShadowCreates()
          }

          await shadowCreatesReady
        }

        return create(args)
      })

      hookSpy.postBeforeOperation = async ({ args, req }) => {
        const raceOperation = req.context.raceOperation

        if (String(args.id) !== String(doc.id) || typeof raceOperation !== 'string') {
          return
        }

        deleteHookAttempts.set(raceOperation, (deleteHookAttempts.get(raceOperation) ?? 0) + 1)

        await req.payload.db.create({
          collection: excludedSlug,
          data: { title: `race hook delete ${raceOperation}` },
          req,
        })
      }

      const firstReq = await createPayloadRequest({
        branch: 'racebranch',
        context: { raceOperation: 'A' },
        payload,
      })
      const secondReq = await createPayloadRequest({
        branch: 'racebranch',
        context: { raceOperation: 'B' },
        payload,
      })

      try {
        await Promise.all([
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: firstReq,
          }),
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: secondReq,
          }),
        ])
      } finally {
        releaseShadowCreates()
        createSpy.mockRestore()
      }

      expect(waitingShadowCreates).toBe(2)
      expect(expectedConcurrentOperationAttemptCounts).toContainEqual(
        [...deleteHookAttempts.values()].sort(),
      )

      const shadows = await payload.find({
        branch: false,
        collection: postsSlug,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
        },
      })

      expect(shadows.docs).toHaveLength(1)
      expect(shadows.docs[0]).not.toHaveProperty('_branchOp')

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: 'racebranch' } },
      })

      expect(changes.docs).toHaveLength(1)
      expect(changes.docs[0]).toMatchObject({ operation: 'delete' })

      const hookWrites = await payload.find({
        collection: excludedSlug,
        pagination: false,
        where: { title: { contains: 'race hook delete ' } },
      })

      expect(hookWrites.docs.map(({ title }) => title).sort()).toEqual([
        'race hook delete A',
        'race hook delete B',
      ])
    })

    test.options(
      'should replace a concurrent delete winner that is removed before the retry consumes it',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({
          collection: postsSlug,
          data: { title: 'removed winner' },
        })
        const deleteHookAttempts = new Map<string, number>()
        const create = payload.db.create.bind(payload.db)
        const findOne = payload.db.findOne.bind(payload.db)
        let releaseShadowCreates!: () => void
        let waitingShadowCreates = 0
        const shadowCreatesReady = new Promise<void>((resolve) => {
          releaseShadowCreates = resolve
        })
        const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
          if (
            args.collection === postsSlug &&
            args.data?._branch === 'racebranch' &&
            String(args.data?._branchDocID) === String(doc.id)
          ) {
            waitingShadowCreates += 1

            if (waitingShadowCreates === 2) {
              releaseShadowCreates()
            }

            await shadowCreatesReady
          }

          return create(args)
        })
        let observedDeleteWinner: Record<string, unknown> | undefined
        let reportRetryRevalidation!: (winner: Record<string, unknown>) => void
        let releaseRetryRevalidation!: () => void
        let didReachRetryRevalidation = false
        const retryRevalidationReached = new Promise<Record<string, unknown>>((resolve) => {
          reportRetryRevalidation = resolve
        })
        const retryRevalidationReleased = new Promise<void>((resolve) => {
          releaseRetryRevalidation = resolve
        })
        const findOneSpy = vi.spyOn(payload.db, 'findOne').mockImplementation(async (args) => {
          const conditions = (args.where as { and?: Record<string, unknown>[] } | undefined)?.and
          const isRetryRevalidation = Boolean(
            conditions?.some((condition) => '_branchDocID' in condition) &&
              conditions.some((condition) => 'id' in condition),
          )

          if (isRetryRevalidation && !didReachRetryRevalidation) {
            didReachRetryRevalidation = true

            if (!observedDeleteWinner) {
              throw new Error('The competing delete winner was not observed before revalidation.')
            }

            reportRetryRevalidation(observedDeleteWinner)
            await retryRevalidationReleased
          }

          const result = await findOne(args)
          const branchResult = result as null | Record<string, unknown>

          if (
            !isRetryRevalidation &&
            branchResult?._branch === 'racebranch' &&
            String(branchResult._branchDocID) === String(doc.id)
          ) {
            observedDeleteWinner = branchResult
          }

          return result
        })

        hookSpy.postBeforeOperation = ({ args, req }) => {
          const raceOperation = req.context.raceOperation

          if (String(args.id) === String(doc.id) && typeof raceOperation === 'string') {
            deleteHookAttempts.set(raceOperation, (deleteHookAttempts.get(raceOperation) ?? 0) + 1)
          }
        }

        const firstReq = await createPayloadRequest({
          branch: 'racebranch',
          context: { raceOperation: 'A' },
          payload,
        })
        const secondReq = await createPayloadRequest({
          branch: 'racebranch',
          context: { raceOperation: 'B' },
          payload,
        })
        const deletes = Promise.all([
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: firstReq,
          }),
          payload.delete({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            req: secondReq,
          }),
        ])

        try {
          const winner = await retryRevalidationReached
          const rawReq = await createPayloadRequest({ branch: false, payload })

          await payload.db.deleteOne({
            branch: false,
            collection: postsSlug,
            req: rawReq,
            where: { id: { equals: winner.id as number | string } },
          })
          await payload.db.deleteMany({
            collection: branchChangesSlug,
            req: rawReq,
            where: { branch: { equals: 'racebranch' } },
          })
          releaseRetryRevalidation()

          const results = await deletes

          expect(results.map(({ id }) => id)).toEqual([doc.id, doc.id])
        } finally {
          releaseShadowCreates()
          releaseRetryRevalidation()
          createSpy.mockRestore()
          findOneSpy.mockRestore()
          await deletes.catch(() => undefined)
        }

        expect([...deleteHookAttempts.values()].sort()).toEqual([1, 3])

        const shadows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'racebranch' } },
        })

        expect(shadows.docs).toHaveLength(1)
        expect(shadows.docs[0]).not.toHaveProperty('_branchOp')
        expect(changes.docs).toHaveLength(1)
        expect(changes.docs[0]).toMatchObject({
          documentID: String(doc.id),
          operation: 'delete',
        })
      },
    )

    test.options(
      'should complete a delete that starts before a competing first edit commits',
      { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
      async () => {
        await payload.create({
          collection: branchesSlug,
          data: { name: 'Race', slug: 'racebranch' },
        })

        const doc = await payload.create({ collection: postsSlug, data: { title: 'mixed race' } })
        const create = payload.db.create.bind(payload.db)
        let releaseDeleteShadow!: () => void
        let markDeleteShadowReady!: () => void
        const deleteShadowReleased = new Promise<void>((resolve) => {
          releaseDeleteShadow = resolve
        })
        const deleteShadowReady = new Promise<void>((resolve) => {
          markDeleteShadowReady = resolve
        })
        let hasPausedDeleteShadow = false
        const createSpy = vi.spyOn(payload.db, 'create').mockImplementation(async (args) => {
          if (
            !hasPausedDeleteShadow &&
            args.collection === postsSlug &&
            args.data?._branch === 'racebranch' &&
            String(args.data?._branchDocID) === String(doc.id)
          ) {
            hasPausedDeleteShadow = true
            markDeleteShadowReady()
            await deleteShadowReleased
          }

          return create(args)
        })
        const deletePromise = payload.delete({
          id: doc.id,
          branch: 'racebranch',
          collection: postsSlug,
        })

        try {
          await deleteShadowReady

          const updateResult = await payload.update({
            id: doc.id,
            branch: 'racebranch',
            collection: postsSlug,
            data: { title: 'edit committed while delete waits' },
          })

          releaseDeleteShadow()

          const deleteResult = await deletePromise

          expect(updateResult.title).toBe('edit committed while delete waits')
          expect(deleteResult.id).toBe(doc.id)
        } finally {
          releaseDeleteShadow()
          createSpy.mockRestore()
          await deletePromise.catch(() => undefined)
        }

        const shadows = await payload.find({
          branch: false,
          collection: postsSlug,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [{ _branch: { equals: 'racebranch' } }, { _branchDocID: { equals: doc.id } }],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'racebranch' } },
        })

        expect(shadows.docs).toHaveLength(1)
        expect(shadows.docs[0]).not.toHaveProperty('_branchOp')
        expect(changes.docs).toHaveLength(1)
        expect(changes.docs[0]).toMatchObject({
          documentID: String(doc.id),
          operation: 'delete',
        })
      },
    )
  })

  /**
   * §16's scheduled merge. Shaped like scheduled publish — a `payload-jobs` row with
   * `waitUntil` and the queueing user — so these cover what merging adds to that: the
   * permission re-check at fire time, and a branch that moved in between.
   */
  test.describe('Scheduled merge', () => {
    let mainDocID: number | string
    // Captured rather than looked up by slug: `slug` de-duplicates against existing
    // branches, so a leftover row would silently rename this one and every assertion
    // would then be reading a different branch.
    let branchID: number | string
    let branchSlug: string

    /**
     * Queues a scheduled merge and fires it immediately.
     *
     * `waitUntil` is backdated rather than set to `new Date()`. The runner takes jobs
     * whose `waitUntil` is *strictly* less than now, so a job queued and run inside the
     * same millisecond is not due yet: `runByID` finds nothing, returns quietly, and
     * the assertion that follows reads a merge that never happened.
     */
    const runScheduledMerge = async (input: Record<string, unknown>) =>
      payload.jobs.runByID({
        id: (
          await payload.jobs.queue({
            input: { branch: branchSlug, ...input },
            overrideAccess: true,
            task: 'scheduleMerge',
            waitUntil: new Date(Date.now() - 60_000),
          })
        ).id,
        overrideAccess: true,
      })

    const readBranch = async () => payload.findByID({ id: branchID, collection: branchesSlug })

    /**
     * What the merge actually did, as one object.
     *
     * Asserted as a whole rather than field by field, because the interesting failures
     * are silent ones: a job that never ran and a merge that refused both leave main
     * untouched, and a status of `open` says the branch did not finish without saying
     * why. Failing on the whole object puts the pending changes and the job's own row
     * in the diff.
     */
    const mergeOutcome = async () => {
      const [branch, changes, jobs] = await Promise.all([
        payload.findByID({ id: branchID, collection: branchesSlug, disableErrors: true }),
        payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        }),
        payload.find({
          collection: 'payload-jobs',
          pagination: false,
          where: { taskSlug: { equals: 'scheduleMerge' } },
        }),
      ])

      return {
        jobsRun: jobs.docs.map((job) => ({
          error: job.error,
          hasError: job.hasError,
          totalTried: job.totalTried,
        })),
        pendingChanges: changes.docs.map((change) => ({
          collectionSlug: change.collectionSlug,
          operation: change.operation,
        })),
        status: branch?.status,
      }
    }

    const asDevUser = async () =>
      (
        await payload.find({
          collection: 'users',
          pagination: false,
          where: { email: { equals: devUser.email } },
        })
      ).docs[0]!

    test.beforeEach(async () => {
      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'Scheduled', slug: 'scheduled' },
      })

      branchID = branchDoc.id
      branchSlug = branchDoc.slug

      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'original on main' },
      })

      mainDocID = doc.id

      await payload.update({
        id: mainDocID,
        branch: branchSlug,
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchMergesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { branch: { equals: branchSlug } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }

      await payload.delete({ id: branchID, collection: branchesSlug })

      const jobs = await payload.find({ collection: 'payload-jobs', pagination: false })

      for (const job of jobs.docs) {
        await payload.delete({ id: job.id, collection: 'payload-jobs' })
      }

      const privateBranches = await payload.find({
        collection: branchesSlug,
        pagination: false,
        where: { slug: { equals: 'private-visibility' } },
      })

      for (const privateBranch of privateBranches.docs) {
        await payload.delete({ id: privateBranch.id, collection: branchesSlug })
      }

      const restrictedUsers = await payload.find({
        collection: 'users',
        pagination: false,
        where: { email: { equals: 'restricted-canceller@example.com' } },
      })

      for (const restrictedUser of restrictedUsers.docs) {
        await payload.delete({ id: restrictedUser.id, collection: 'users' })
      }
    })

    test('should register the scheduleMerge task when branching is enabled', () => {
      expect(payload.config.jobs.tasks.map((task) => task.slug)).toContain('scheduleMerge')
    })

    test.options(
      'should complete a scheduled merge while recording progress in MongoDB',
      { db: 'mongo' },
      async () => {
        const user = await asDevUser()

        await runScheduledMerge({ user: { relationTo: 'users', value: user.id } })

        expect(await mergeOutcome()).toMatchObject({
          jobsRun: [],
          pendingChanges: [],
          status: 'merged',
        })
        expect((await readBranch()).mergeProgress).toBeFalsy()
      },
    )

    test.options(
      'should clear scheduled merge progress without replacing the merge error',
      { db: 'mongo' },
      async () => {
        const user = await asDevUser()
        const expectedError = 'Scheduled merge failed after progress was recorded'
        let didObserveProgressBeforeFailure = false

        await payload.update({
          id: branchID,
          collection: branchesSlug,
          data: { mergeProgress: 'stale' },
          overrideAccess: true,
        })
        expect((await readBranch()).mergeProgress).toBe('stale')

        const job = await payload.jobs.queue({
          input: { branch: branchSlug, user: { relationTo: 'users', value: user.id } },
          overrideAccess: true,
          task: 'scheduleMerge',
          waitUntil: new Date(Date.now() - 60_000),
        })

        hookSpy.beforeChange = async ({
          data,
          req,
        }: {
          data: Record<string, unknown>
          req: PayloadRequest
        }) => {
          if (data.title === 'edited on branch') {
            const branchDuringMerge = await req.payload.findByID({
              id: branchID,
              collection: branchesSlug,
            })

            expect(branchDuringMerge.mergeProgress).toBe('running')
            didObserveProgressBeforeFailure = true
            throw new Error(expectedError)
          }
        }

        try {
          await payload.jobs.runByID({ id: job.id, overrideAccess: true })

          const [branch, onMain, pendingChanges, ran] = await Promise.all([
            readBranch(),
            payload.findByID({ id: mainDocID, collection: postsSlug }),
            payload.find({
              collection: branchChangesSlug,
              pagination: false,
              where: { branch: { equals: branchSlug } },
            }),
            payload.findByID({ id: job.id, collection: 'payload-jobs' }),
          ])

          expect(branch.mergeProgress).toBeFalsy()
          expect(branch.status).toBe('open')
          expect(didObserveProgressBeforeFailure).toBe(true)
          expect(onMain.title).toBe('original on main')
          expect(pendingChanges.docs).toHaveLength(1)
          expect(ran.error?.message).toBe(expectedError)
          expect(ran.hasError).toBe(true)
        } finally {
          hookSpy.beforeChange = undefined
        }
      },
    )

    test('should apply the branch when the job runs', async () => {
      const user = await asDevUser()

      await runScheduledMerge({ user: { relationTo: 'users', value: user.id } })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    test('should close the branch when the schedule asked for it', async () => {
      const user = await asDevUser()

      await runScheduledMerge({
        closeBranch: true,
        user: { relationTo: 'users', value: user.id },
      })

      // Nothing pending is what earns the close, so both are asserted together: a
      // status of `open` with a change still listed is a merge that did not run.
      expect(await mergeOutcome()).toMatchObject({ pendingChanges: [], status: 'closed' })
    })

    test('should refuse to merge when the queueing user no longer resolves', async () => {
      // Scheduled publish falls back to `overrideAccess` here. A merge writes across
      // production, so the same fallback would turn a deleted account into an
      // unchecked one — this fails instead.
      const job = await payload.jobs.queue({
        input: { branch: branchSlug, user: { relationTo: 'users', value: 999999 } },
        overrideAccess: true,
        task: 'scheduleMerge',
        waitUntil: new Date(Date.now() - 60_000),
      })

      await payload.jobs.runByID({ id: job.id, overrideAccess: true })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')

      // Asserted explicitly: "nothing was merged" is also what a job that never ran
      // looks like, so without this the test passes whether or not it fired.
      const ran = await payload.findByID({ id: job.id, collection: 'payload-jobs' })

      expect(ran.hasError).toBe(true)
      expect(ran.totalTried).toBeGreaterThan(0)
    })

    test('should not cancel a scheduled merge for an inaccessible branch', async () => {
      const privateBranch = await payload.create({
        collection: branchesSlug,
        data: { name: 'Private visibility', slug: 'private-visibility' },
      })
      const restrictedUser = await payload.create({
        collection: 'users',
        data: { email: 'restricted-canceller@example.com', password: 'test' },
      })
      const job = await payload.jobs.queue({
        input: {
          branch: privateBranch.slug,
          user: { relationTo: 'users', value: restrictedUser.id },
        },
        overrideAccess: true,
        task: 'scheduleMerge',
        waitUntil: new Date(Date.now() + 60_000),
      })
      const req = await createPayloadRequest({
        payload,
        user: { ...restrictedUser, collection: 'users' },
      })

      await scheduleMergeHandler({ deleteID: job.id, req })

      const retainedJob = await payload.findByID({
        id: job.id,
        collection: 'payload-jobs',
        disableErrors: true,
      })

      expect(retainedJob).not.toBeNull()
    })

    test('should not cancel a job that is not a scheduled merge', async () => {
      const user = await asDevUser()
      const unrelatedJob = await payload.db.create({
        collection: 'payload-jobs',
        data: { input: {}, taskSlug: 'inline' },
      })
      const req = await createPayloadRequest({ payload, user })

      await scheduleMergeHandler({ deleteID: unrelatedJob.id, req })

      const retainedJob = await payload.findByID({
        id: unrelatedJob.id,
        collection: 'payload-jobs',
        disableErrors: true,
      })

      expect(retainedJob).not.toBeNull()
    })

    test('should skip queued changes that no longer exist', async () => {
      const user = await asDevUser()

      const changes = await payload.find({
        collection: branchChangesSlug,
        pagination: false,
        where: { branch: { equals: branchSlug } },
      })

      const realChangeID = String(changes.docs[0]!.id)

      // A change discarded between queueing and firing simply does not match.
      await runScheduledMerge({
        changes: [realChangeID, '999999'],
        user: { relationTo: 'users', value: user.id },
      })

      const onMain = await payload.findByID({ id: mainDocID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    test('should clear the branch progress marker when the job finishes', async () => {
      const user = await asDevUser()

      await runScheduledMerge({ user: { relationTo: 'users', value: user.id } })

      // A stale "running" outlives the run and reads as a merge still in flight.
      expect((await readBranch()).mergeProgress).toBeFalsy()
    })
  })

  test.describe('Merge REST endpoint', () => {
    let branchID: number | string
    let docID: number | string

    test.beforeEach(async () => {
      const branchDoc = await payload.create({
        collection: branchesSlug,
        data: { name: 'REST merge', slug: 'restmerge' },
      })
      branchID = branchDoc.id

      const doc = await payload.create({
        collection: postsSlug,
        data: { title: 'original on main' },
      })
      docID = doc.id

      await payload.update({
        id: docID,
        branch: 'restmerge',
        collection: postsSlug,
        data: { title: 'edited on branch' },
      })
    })

    test.afterEach(async () => {
      const rows = await payload.find({ branch: false, collection: postsSlug, pagination: false })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: postsSlug })
      }

      for (const collection of [branchChangesSlug, branchesSlug]) {
        const found = await payload.find({
          collection,
          pagination: false,
          where: { [collection === branchesSlug ? 'slug' : 'branch']: { equals: 'restmerge' } },
        })

        for (const row of found.docs) {
          await payload.delete({ id: row.id, collection })
        }
      }
    })

    // A merge is a write to main performed on a branch's behalf, so it has to bypass
    // branch resolution — including when the request that triggered it names a branch.
    // The create-promotion write went through `updateByIDOperation`, which takes no
    // `branch` argument and reads the request, so with `?branch=` the promotion resolved
    // against the branch it was merging and silently did nothing.
    test('should merge even when the triggering request names the branch', async () => {
      const created = await payload.create({
        branch: 'restmerge',
        collection: postsSlug,
        data: { title: 'created on branch' },
      })

      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge?branch=restmerge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(200)

      // Both operations the merge performs: the promotion of a branch-created document,
      // and the update of a document that already existed on main.
      const promoted = await payload.findByID({ id: created.id, collection: postsSlug })
      const updated = await payload.findByID({ id: docID, collection: postsSlug })

      expect(promoted.title).toBe('created on branch')
      expect(updated.title).toBe('edited on branch')
    })

    test('should reject an unauthenticated merge', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        // NextRESTClient attaches its stored token unless auth is disabled.
        auth: false,
        body: JSON.stringify({}),
      })

      expect([401, 403]).toContain(res.status)

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    test('should report the pending changes on a dryRun without mutating', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({ dryRun: true }),
        headers: { Authorization: `JWT ${token}` },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.mergeable).toHaveLength(1)
      expect(String(data.mergeable[0].docID)).toBe(String(docID))

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onMain.title).toBe('original on main')
    })

    test('should apply the merge when authenticated', async () => {
      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.merged).toHaveLength(1)

      const onMain = await payload.findByID({ id: docID, collection: postsSlug })

      expect(onMain.title).toBe('edited on branch')
    })

    test('should enforce access as the requesting user rather than overriding it', async () => {
      const editor = await payload.create({
        collection: 'users',
        data: { email: 'resteditor@example.com', password: 'test' },
      })

      const restricted = await payload.create({
        collection: restrictedSlug,
        data: { title: 'restricted on main' },
      })

      await payload.update({
        id: restricted.id,
        branch: 'restmerge',
        collection: restrictedSlug,
        data: { title: 'edited on branch' },
      })

      const login = await restClient
        .POST('/users/login', {
          body: JSON.stringify({ email: 'resteditor@example.com', password: 'test' }),
        })
        .then((res) => res.json())

      const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
        body: JSON.stringify({ dryRun: true }),
        headers: { Authorization: `JWT ${login.token}` },
      })
      const data = await res.json()

      expect(data.blocked.map((each: any) => String(each.docID))).toContain(String(restricted.id))

      const rows = await payload.find({
        branch: false,
        collection: restrictedSlug,
        pagination: false,
      })

      for (const row of rows.docs) {
        await payload.delete({ id: row.id, branch: false, collection: restrictedSlug })
      }

      await payload.delete({ id: editor.id, collection: 'users' })
    })

    test('should return 404 for an unknown branch', async () => {
      const res = await restClient.POST(`/${branchesSlug}/999999/merge`, {
        body: JSON.stringify({}),
        headers: { Authorization: `JWT ${token}` },
      })

      expect(res.status).toBe(404)
    })

    /**
     * A merge walks an arbitrary number of documents one at a time, so the panel
     * needs to report where it is. Streaming the loop it already runs avoids
     * inventing a job and a polling endpoint to carry that state.
     */
    test.describe('streamed progress', () => {
      /** Parses the NDJSON body into the events the client would see. */
      const readEvents = (body: string) =>
        body
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line) as Record<string, any>)

      test('should stream one progress event per change and finish with the result', async () => {
        const second = await payload.create({
          branch: 'restmerge',
          collection: postsSlug,
          data: { title: 'created on branch' },
        })

        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })

        expect(res.status).toBe(200)
        expect(res.headers.get('content-type')).toContain('application/x-ndjson')

        const events = readEvents(await res.text())
        const progress = events.filter((event) => event.type === 'progress')
        const complete = events.find((event) => event.type === 'complete')

        expect(progress).toHaveLength(2)
        expect(progress.map((event) => event.current)).toEqual([1, 2])
        progress.forEach((event) => expect(event.total).toBe(2))

        expect(complete).toBeDefined()
        expect(complete!.result.merged).toHaveLength(2)

        // The stream is the whole response: the writes really happened.
        const onMain = await payload.findByID({ id: docID, collection: postsSlug })
        const created = await payload.findByID({ id: second.id, collection: postsSlug })

        expect(onMain.title).toBe('edited on branch')
        expect(created.title).toBe('created on branch')
      })

      test('should stream only the selected changes', async () => {
        await payload.create({
          branch: 'restmerge',
          collection: postsSlug,
          data: { title: 'created on branch' },
        })

        const changes = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'restmerge' } },
        })

        const updateChange = changes.docs.find((change) => change.operation === 'update')

        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ changes: [updateChange!.id], stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })

        const events = readEvents(await res.text())
        const complete = events.find((event) => event.type === 'complete')

        expect(events.filter((event) => event.type === 'progress')).toHaveLength(1)
        expect(complete!.result.merged).toHaveLength(1)

        // The unselected change keeps the branch open.
        const remaining = await payload.find({
          collection: branchChangesSlug,
          pagination: false,
          where: { branch: { equals: 'restmerge' } },
        })

        expect(remaining.docs).toHaveLength(1)
        expect(remaining.docs[0]!.operation).toBe('create')
      })

      test('should enforce access on the streamed path too', async () => {
        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          auth: false,
          body: JSON.stringify({ stream: true }),
        })

        expect([401, 403]).toContain(res.status)

        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })

      test('should fall back to a plain JSON response for a dryRun', async () => {
        const res = await restClient.POST(`/${branchesSlug}/${branchID}/merge`, {
          body: JSON.stringify({ dryRun: true, stream: true }),
          headers: { Authorization: `JWT ${token}` },
        })

        expect(res.headers.get('content-type')).toContain('application/json')

        const data = await res.json()

        expect(data.mergeable).toHaveLength(1)

        const onMain = await payload.findByID({ id: docID, collection: postsSlug })

        expect(onMain.title).toBe('original on main')
      })
    })
  })
})
