/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import { createPayloadRequest, updateByIDOperation } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  mergeSecurityEditorEmail,
  mergeSecurityPagesSlug,
  mergeSecurityPostsSlug,
} from './merge-security.config.js'
import { mergeSecuritySpy, resetMergeSecuritySpy } from './mergeSecuritySpy.js'
import { branchChangesSlug, branchesSlug } from './shared.js'

const createBranch = async ({ name, payload }: { name: string; payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name },
    overrideAccess: true,
  })

test.suite('Branch merge security', { config: './merge-security.config.ts' }, () => {
  test.beforeEach(resetMergeSecuritySpy)

  test.afterEach(resetMergeSecuritySpy)

  test('should not disclose a blocked document title', async ({ payload }) => {
    const branch = await createBranch({ name: 'Private blocked title', payload })
    const editor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const secretTitle = 'private acquisition plan'
    const branchDocument = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityPagesSlug,
      data: { title: secretTitle },
      overrideAccess: true,
    })
    const editorUser = { ...editor, collection: 'users' } as const
    await expect(
      payload.find({
        branch: branch.slug,
        collection: mergeSecurityPagesSlug,
        overrideAccess: false,
        pagination: false,
        user: editorUser,
        where: { id: { equals: branchDocument.id } },
      }),
    ).rejects.toMatchObject({ status: 403 })

    mergeSecuritySpy.allowPageCreate = false

    const result = await payload.branches.merge({
      branch: branch.slug,
      dryRun: true,
      overrideAccess: false,
      user: editorUser,
    })

    expect(result.blocked).toHaveLength(1)
    expect(result.blocked[0]).toMatchObject({
      docID: branchDocument.id,
      docTitle: String(branchDocument.id),
    })
    expect(JSON.stringify(result.blocked)).not.toContain(secretTitle)
  })

  test('should not let a public update operation use create access', async ({ payload }) => {
    const editor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const existingDocument = await payload.create({
      collection: mergeSecurityPagesSlug,
      data: { title: 'original protected title' },
      overrideAccess: true,
    })
    const req = await createPayloadRequest({
      branch: false,
      payload,
      user: { ...editor, collection: 'users' },
    })
    const callerControlledArguments = {
      id: existingDocument.id,
      collection: payload.collections[mergeSecurityPagesSlug]!,
      data: { title: 'unauthorised replacement' },
      operation: 'create' as const,
      overrideAccess: false,
      req,
    }

    await expect(updateByIDOperation(callerControlledArguments)).rejects.toMatchObject({
      status: 403,
    })

    const persistedDocument = await payload.findByID({
      id: existingDocument.id,
      collection: mergeSecurityPagesSlug,
      overrideAccess: true,
    })

    expect(persistedDocument.title).toBe('original protected title')
  })

  test('should keep a rejected non-transactional branch create off main', async ({ payload }) => {
    const branch = await createBranch({ name: 'Rejected create merge', payload })
    const branchDocument = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityPostsSlug,
      data: { title: 'rejected during merge' },
      overrideAccess: true,
    })
    const beginTransaction = payload.db.beginTransaction

    mergeSecuritySpy.rejectedPostTitle = branchDocument.title
    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({ branch: branch.slug, overrideAccess: true }),
      ).rejects.toThrow('Rejected by create hook')
    } finally {
      payload.db.beginTransaction = beginTransaction
      mergeSecuritySpy.rejectedPostTitle = undefined
    }

    const mainDocument = await payload.findByID({
      id: branchDocument.id,
      collection: mergeSecurityPostsSlug,
      disableErrors: true,
      overrideAccess: true,
    })
    const remainingBranchDocument = await payload.findByID({
      id: branchDocument.id,
      branch: branch.slug,
      collection: mergeSecurityPostsSlug,
      disableErrors: true,
      overrideAccess: true,
    })
    const remainingChanges = await payload.find({
      collection: branchChangesSlug,
      overrideAccess: true,
      pagination: false,
      where: { branch: { equals: branch.slug } },
    })

    expect(mainDocument).toBeNull()
    expect(remainingBranchDocument?.title).toBe(branchDocument.title)
    expect(remainingChanges.docs).toHaveLength(1)
  })

  test('should merge a permitted non-transactional branch create with access enabled', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Permitted create merge', payload })
    const editor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const existingDocument = await payload.create({
      collection: mergeSecurityPostsSlug,
      data: { title: 'before branch edit' },
      overrideAccess: true,
    })

    await payload.update({
      id: existingDocument.id,
      branch: branch.slug,
      collection: mergeSecurityPostsSlug,
      data: { title: 'after branch edit' },
      overrideAccess: true,
    })

    const branchDocument = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityPostsSlug,
      data: { title: 'permitted during merge' },
      overrideAccess: true,
    })
    const beginTransaction = payload.db.beginTransaction

    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await payload.branches.merge({
        branch: branch.slug,
        overrideAccess: false,
        user: { ...editor, collection: 'users' },
      })
    } finally {
      payload.db.beginTransaction = beginTransaction
    }

    const updatedMainDocument = await payload.findByID({
      id: existingDocument.id,
      collection: mergeSecurityPostsSlug,
      overrideAccess: true,
    })
    const mainDocument = await payload.findByID({
      id: branchDocument.id,
      collection: mergeSecurityPostsSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(updatedMainDocument.title).toBe('after branch edit')
    expect(mainDocument?.title).toBe(branchDocument.title)
  })
})
