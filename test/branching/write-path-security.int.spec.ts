/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import {
  commitTransaction,
  createDataloaderCacheKey,
  createPayloadRequest,
  initTransaction,
  killTransaction,
} from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { hookSpy } from './hookSpy.js'
import {
  branchChangesSlug,
  branchesSlug,
  headerGlobalSlug,
  homepageGlobalSlug,
  pagesSlug,
  postsSlug,
  restrictedSlug,
  uninitializedGlobalSlug,
} from './shared.js'

const createBranch = async ({ name, payload }: { name: string; payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name },
    overrideAccess: true,
  })

const closeBranch = async ({ id, payload }: { id: number | string; payload: Payload }) =>
  payload.update({
    id,
    collection: branchesSlug,
    data: { status: 'closed' },
    overrideAccess: true,
  })

test.suite('Branching write-path security', { config: './config.ts' }, () => {
  test('should not fork a document before a denied single update', async ({ payload }) => {
    const branch = await createBranch({ name: 'Denied Update', payload })
    const editor = await payload.create({
      collection: 'users',
      data: { email: 'editor@example.com', password: 'test' },
      overrideAccess: true,
    })
    const mainDocument = await payload.create({
      collection: restrictedSlug,
      data: { title: 'main title' },
      overrideAccess: true,
    })

    await expect(
      payload.update({
        id: mainDocument.id,
        branch: branch.slug,
        collection: restrictedSlug,
        data: { title: 'edited on branch' },
        disableTransaction: true,
        overrideAccess: false,
        user: { ...editor, collection: 'users' } as never,
      }),
    ).rejects.toThrow()

    const shadowRows = await payload.find({
      branch: false,
      collection: restrictedSlug,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: {
        and: [{ _branch: { equals: branch.slug } }, { _branchDocID: { equals: mainDocument.id } }],
      },
    })
    const changes = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(shadowRows.docs).toHaveLength(0)
    expect(changes.docs).toHaveLength(0)
  })

  test('should reject a bulk collection update on a closed branch', async ({ payload }) => {
    const branch = await createBranch({ name: 'Closed Bulk Update', payload })
    const first = await payload.create({
      collection: postsSlug,
      data: { title: 'first main title' },
      overrideAccess: true,
    })
    const second = await payload.create({
      collection: postsSlug,
      data: { title: 'second main title' },
      overrideAccess: true,
    })

    await closeBranch({ id: branch.id, payload })

    await expect(
      payload.update({
        branch: branch.slug,
        collection: postsSlug,
        data: { title: 'closed branch title' },
        disableTransaction: true,
        overrideAccess: true,
        where: { id: { in: [first.id, second.id] } },
      }),
    ).rejects.toThrow()

    const mainDocuments = await payload.find({
      collection: postsSlug,
      overrideAccess: true,
      pagination: false,
      sort: 'title',
    })
    const changes = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(mainDocuments.docs.map(({ title }) => title)).toEqual([
      'first main title',
      'second main title',
    ])
    expect(changes.docs).toHaveLength(0)
  })

  test('should reject a closed collection write before project hooks run', async ({ payload }) => {
    const branch = await createBranch({ name: 'Closed Collection Hook', payload })
    const mainDocument = await payload.create({
      collection: postsSlug,
      data: { title: 'main title' },
      overrideAccess: true,
    })

    await closeBranch({ id: branch.id, payload })

    let beforeOperationCalls = 0
    hookSpy.postBeforeOperation = () => {
      beforeOperationCalls += 1
    }

    try {
      await expect(
        payload.update({
          id: mainDocument.id,
          branch: branch.slug,
          collection: postsSlug,
          data: { title: 'closed branch title' },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    } finally {
      hookSpy.postBeforeOperation = undefined
    }

    expect(beforeOperationCalls).toBe(0)
  })

  test('should reject a global update on a closed branch', async ({ payload }) => {
    const branch = await createBranch({ name: 'Closed Global Update', payload })

    await payload.updateGlobal({
      slug: headerGlobalSlug,
      data: { navLabel: 'main navigation' },
      overrideAccess: true,
    })
    await closeBranch({ id: branch.id, payload })

    await expect(
      payload.updateGlobal({
        slug: headerGlobalSlug,
        branch: branch.slug,
        data: { navLabel: 'closed branch navigation' },
        disableTransaction: true,
        overrideAccess: true,
      }),
    ).rejects.toThrow()

    const main = await payload.findGlobal({
      slug: headerGlobalSlug,
      overrideAccess: true,
    })
    const changes = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(main.navLabel).toBe('main navigation')
    expect(changes.docs).toHaveLength(0)
  })

  test('should reject a closed global write before project hooks run', async ({ payload }) => {
    const branch = await createBranch({ name: 'Closed Global Hook', payload })

    await payload.updateGlobal({
      slug: headerGlobalSlug,
      data: { navLabel: 'main navigation' },
      overrideAccess: true,
    })
    await closeBranch({ id: branch.id, payload })

    let beforeOperationCalls = 0
    hookSpy.headerBeforeOperation = () => {
      beforeOperationCalls += 1
    }

    try {
      await expect(
        payload.updateGlobal({
          slug: headerGlobalSlug,
          branch: branch.slug,
          data: { navLabel: 'closed branch navigation' },
          overrideAccess: true,
        }),
      ).rejects.toThrow()
    } finally {
      hookSpy.headerBeforeOperation = undefined
    }

    expect(beforeOperationCalls).toBe(0)
  })

  test('should keep the first global write isolated to its branch', async ({ payload }) => {
    const branch = await createBranch({ name: 'First Global Write', payload })

    await payload.updateGlobal({
      slug: uninitializedGlobalSlug,
      branch: branch.slug,
      data: { branchValue: 'branch-only value' },
      overrideAccess: true,
    })

    const onMain = await payload.findGlobal({
      slug: uninitializedGlobalSlug,
      overrideAccess: true,
    })
    const onBranch = await payload.findGlobal({
      slug: uninitializedGlobalSlug,
      branch: branch.slug,
      overrideAccess: true,
    })
    const changes = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(onMain.branchValue).not.toBe('branch-only value')
    expect(onBranch.branchValue).toBe('branch-only value')
    expect(changes.docs).toHaveLength(1)
    expect(changes.docs[0]).toMatchObject({
      entityType: 'global',
      globalSlug: uninitializedGlobalSlug,
      operation: 'update',
    })
  })

  test('should reject a global version restore on a closed branch', async ({ payload }) => {
    const branch = await createBranch({ name: 'Closed Global Restore', payload })

    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { _status: 'published', heroTitle: 'historical branch title' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      data: { _status: 'published', heroTitle: 'current branch title' },
      overrideAccess: true,
    })

    const versions = await payload.findGlobalVersions({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      overrideAccess: true,
      pagination: false,
    })
    const historicalVersion = versions.docs.find(
      ({ version }) => version.heroTitle === 'historical branch title',
    )

    expect(historicalVersion).toBeDefined()

    await closeBranch({ id: branch.id, payload })

    await expect(
      payload.restoreGlobalVersion({
        id: historicalVersion!.id,
        slug: homepageGlobalSlug,
        branch: branch.slug,
        overrideAccess: true,
      }),
    ).rejects.toThrow()

    const onBranch = await payload.findGlobal({
      slug: homepageGlobalSlug,
      branch: branch.slug,
      overrideAccess: true,
    })

    expect(onBranch.heroTitle).toBe('current branch title')
  })

  test('should remove a rejected create from a closed branch without a transaction', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Closed Create', payload })

    await closeBranch({ id: branch.id, payload })

    await expect(
      payload.create({
        branch: branch.slug,
        collection: postsSlug,
        data: { title: 'created after closing' },
        disableTransaction: true,
        overrideAccess: true,
      }),
    ).rejects.toThrow()

    const branchRows = await payload.find({
      branch: false,
      collection: postsSlug,
      overrideAccess: true,
      pagination: false,
      showHiddenFields: true,
      where: { _branch: { equals: branch.slug } },
    })

    expect(branchRows.docs).toHaveLength(0)
  })

  test('should fork before restoring a collection version on an untouched branch', async ({
    payload,
  }) => {
    const mainDocument = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'historical main title' },
      overrideAccess: true,
    })

    await payload.update({
      id: mainDocument.id,
      collection: pagesSlug,
      data: { _status: 'published', title: 'current main title' },
      overrideAccess: true,
    })

    const versions = await payload.findVersions({
      collection: pagesSlug,
      overrideAccess: true,
      pagination: false,
      where: { parent: { equals: mainDocument.id } },
    })
    const historicalVersion = versions.docs.find(
      ({ version }) => version.title === 'historical main title',
    )

    expect(historicalVersion).toBeDefined()

    const branch = await createBranch({ name: 'Restore Untouched', payload })

    await payload.restoreVersion({
      id: historicalVersion!.id,
      branch: branch.slug,
      collection: pagesSlug,
      overrideAccess: false,
    })

    const onMain = await payload.findByID({
      id: mainDocument.id,
      collection: pagesSlug,
      overrideAccess: true,
    })
    const onBranch = await payload.findByID({
      id: mainDocument.id,
      branch: branch.slug,
      collection: pagesSlug,
      overrideAccess: true,
    })
    const changes = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(onMain.title).toBe('current main title')
    expect(onBranch.title).toBe('historical main title')
    expect(changes.docs).toHaveLength(1)
    expect(changes.docs[0]).toMatchObject({
      collectionSlug: pagesSlug,
      operation: 'update',
    })
  })

  test('should refresh the caller request after restoring a collection version', async ({
    payload,
  }) => {
    const mainDocument = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'historical main title' },
      overrideAccess: true,
    })

    await payload.update({
      id: mainDocument.id,
      collection: pagesSlug,
      data: { _status: 'published', title: 'current main title' },
      overrideAccess: true,
    })

    const versions = await payload.findVersions({
      collection: pagesSlug,
      overrideAccess: true,
      pagination: false,
      where: { parent: { equals: mainDocument.id } },
    })
    const historicalVersion = versions.docs.find(
      ({ version }) => version.title === 'historical main title',
    )

    expect(historicalVersion).toBeDefined()

    const branch = await createBranch({ name: 'Restore Same Request', payload })
    const req = await createPayloadRequest({ branch: branch.slug, payload })
    const cacheKey = createDataloaderCacheKey({
      branch: branch.slug,
      collectionSlug: pagesSlug,
      currentDepth: 0,
      depth: 1,
      docID: mainDocument.id,
      draft: false,
      fallbackLocale: req.fallbackLocale!,
      locale: req.locale!,
      overrideAccess: true,
      showHiddenFields: false,
      transactionID: req.transactionID!,
    })
    const beforeRestore = await req.payloadDataLoader.load(cacheKey)

    await payload.restoreVersion({
      id: historicalVersion!.id,
      collection: pagesSlug,
      overrideAccess: true,
      req,
    })

    const afterRestore = await req.payloadDataLoader.load(cacheKey)

    expect(beforeRestore.title).toBe('current main title')
    expect(afterRestore.title).toBe('historical main title')
  })

  test.options(
    'should roll back beforeOperation writes when a branch version restore fails',
    {
      db: (databaseAdapter) => databaseAdapter === 'mongodb' || databaseAdapter === 'mongodb-atlas',
    },
    async ({ payload }) => {
      const mainDocument = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'historical main title' },
        overrideAccess: true,
      })

      await payload.update({
        id: mainDocument.id,
        collection: pagesSlug,
        data: { _status: 'published', title: 'current main title' },
        overrideAccess: true,
      })

      const versions = await payload.findVersions({
        collection: pagesSlug,
        overrideAccess: true,
        pagination: false,
        where: { parent: { equals: mainDocument.id } },
      })
      const historicalVersion = versions.docs.find(
        ({ version }) => version.title === 'historical main title',
      )

      expect(historicalVersion).toBeDefined()

      const branch = await createBranch({ name: 'Restore Hook Rollback', payload })
      const req = await createPayloadRequest({ payload })
      const sentinelEmail = 'restore-hook-sentinel@example.com'
      let beforeOperationCalls = 0
      const operationOrder: string[] = []

      hookSpy.pageBeforeOperation = async ({ req }) => {
        beforeOperationCalls += 1
        operationOrder.push('beforeOperation')

        await req.payload.create({
          collection: 'users',
          data: { email: sentinelEmail, password: 'test' },
          overrideAccess: true,
          req,
        })
      }
      hookSpy.pageBeforeChange = () => {
        operationOrder.push('beforeChange')
        throw new Error('Rejected after the restore beforeOperation hook')
      }
      hookSpy.pageUpdateAccess = () => {
        operationOrder.push('access')
      }

      try {
        await expect(
          payload.restoreVersion({
            id: historicalVersion!.id,
            branch: branch.slug,
            collection: pagesSlug,
            overrideAccess: false,
            req,
          }),
        ).rejects.toThrow('Rejected after the restore beforeOperation hook')
      } finally {
        hookSpy.pageBeforeChange = undefined
        hookSpy.pageBeforeOperation = undefined
        hookSpy.pageUpdateAccess = undefined
      }

      const sentinelUsers = await payload.find({
        collection: 'users',
        overrideAccess: true,
        pagination: false,
        where: { email: { equals: sentinelEmail } },
      })
      const shadowRows = await payload.find({
        branch: false,
        collection: pagesSlug,
        overrideAccess: true,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [
            { _branch: { equals: branch.slug } },
            { _branchDocID: { equals: mainDocument.id } },
          ],
        },
      })
      const changes = await payload.find({
        collection: branchChangesSlug,
        overrideAccess: true,
        pagination: false,
        where: { branch: { equals: branch.slug } },
      })
      const sameRequestRead = await payload.findByID({
        id: mainDocument.id,
        branch: branch.slug,
        collection: pagesSlug,
        overrideAccess: true,
        req,
      })

      expect(beforeOperationCalls).toBe(1)
      expect(operationOrder).toEqual(['beforeOperation', 'access', 'beforeChange'])
      expect(sentinelUsers.docs).toHaveLength(0)
      expect(shadowRows.docs).toHaveLength(0)
      expect(changes.docs).toHaveLength(0)
      expect(sameRequestRead.title).toBe('current main title')
    },
  )

  test.options(
    'should reject an untouched branch restore inside a caller transaction without side effects',
    {
      db: (databaseAdapter) => databaseAdapter === 'mongodb' || databaseAdapter === 'mongodb-atlas',
    },
    async ({ payload }) => {
      const mainDocument = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'historical main title' },
        overrideAccess: true,
      })

      await payload.update({
        id: mainDocument.id,
        collection: pagesSlug,
        data: { _status: 'published', title: 'current main title' },
        overrideAccess: true,
      })

      const versions = await payload.findVersions({
        collection: pagesSlug,
        overrideAccess: true,
        pagination: false,
        where: { parent: { equals: mainDocument.id } },
      })
      const historicalVersion = versions.docs.find(
        ({ version }) => version.title === 'historical main title',
      )

      expect(historicalVersion).toBeDefined()

      const branch = await createBranch({ name: 'Caller Restore Untouched', payload })
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      const earlierDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'created before rejected branch restore' },
        overrideAccess: true,
        req,
      })

      try {
        await expect(
          payload.restoreVersion({
            id: historicalVersion!.id,
            branch: branch.slug,
            collection: pagesSlug,
            overrideAccess: true,
            req,
          }),
        ).rejects.toMatchObject({
          message: 'Cannot restore an untouched branch document within an existing transaction.',
          status: 409,
        })

        expect(req.transactionID).toBe(callerTransactionID)

        const shadowRows = await payload.find({
          branch: false,
          collection: pagesSlug,
          overrideAccess: true,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [
              { _branch: { equals: branch.slug } },
              { _branchDocID: { equals: mainDocument.id } },
            ],
          },
        })
        const changes = await payload.find({
          collection: branchChangesSlug,
          overrideAccess: true,
          pagination: false,
          where: { branch: { equals: branch.slug } },
        })

        expect(shadowRows.docs).toHaveLength(0)
        expect(changes.docs).toHaveLength(0)

        await commitTransaction(req)

        const persistedDocument = await payload.findByID({
          id: earlierDocument.id,
          collection: postsSlug,
          overrideAccess: true,
        })
        const shadowRowsAfterCommit = await payload.find({
          branch: false,
          collection: pagesSlug,
          overrideAccess: true,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [
              { _branch: { equals: branch.slug } },
              { _branchDocID: { equals: mainDocument.id } },
            ],
          },
        })
        const changesAfterCommit = await payload.find({
          collection: branchChangesSlug,
          overrideAccess: true,
          pagination: false,
          where: { branch: { equals: branch.slug } },
        })

        expect(persistedDocument.title).toBe('created before rejected branch restore')
        expect(shadowRowsAfterCommit.docs).toHaveLength(0)
        expect(changesAfterCommit.docs).toHaveLength(0)
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should preserve caller work when a collection version restore fails',
    {
      db: (databaseAdapter) => databaseAdapter === 'mongodb' || databaseAdapter === 'mongodb-atlas',
    },
    async ({ payload }) => {
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      const earlierDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'created before failed collection restore' },
        overrideAccess: true,
        req,
      })

      try {
        await expect(
          payload.restoreVersion({
            id: '',
            collection: pagesSlug,
            overrideAccess: true,
            req,
          }),
        ).rejects.toThrow('Missing ID of version to restore.')

        expect(req.transactionID).toBe(callerTransactionID)

        await commitTransaction(req)

        const persistedDocument = await payload.findByID({
          id: earlierDocument.id,
          collection: postsSlug,
          overrideAccess: true,
        })

        expect(persistedDocument.title).toBe('created before failed collection restore')
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should preserve caller work when a global version restore fails',
    {
      db: (databaseAdapter) => databaseAdapter === 'mongodb' || databaseAdapter === 'mongodb-atlas',
    },
    async ({ payload }) => {
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      const earlierDocument = await payload.create({
        collection: postsSlug,
        data: { title: 'created before failed global restore' },
        overrideAccess: true,
        req,
      })

      try {
        await expect(
          payload.restoreGlobalVersion({
            id: '',
            slug: homepageGlobalSlug,
            overrideAccess: true,
            req,
          }),
        ).rejects.toThrow()

        expect(req.transactionID).toBe(callerTransactionID)

        await commitTransaction(req)

        const persistedDocument = await payload.findByID({
          id: earlierDocument.id,
          collection: postsSlug,
          overrideAccess: true,
        })

        expect(persistedDocument.title).toBe('created before failed global restore')
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )
})
