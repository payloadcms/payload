/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { createPayloadRequest, updateByIDOperation } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  mergeSecurityCloudUploadsDirectory,
  mergeSecurityCloudUploadsSlug,
  mergeSecurityEditorEmail,
  mergeSecurityPagesSlug,
  mergeSecurityPostsSlug,
  mergeSecurityTrashEditorEmail,
  mergeSecurityUploadsDirectory,
  mergeSecurityUploadsSlug,
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

  test.afterEach(async () => {
    resetMergeSecuritySpy()
    await Promise.all([
      fs.promises.rm(mergeSecurityCloudUploadsDirectory, { force: true, recursive: true }),
      fs.promises.rm(mergeSecurityUploadsDirectory, { force: true, recursive: true }),
    ])
  })

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

  test('should report denied delete access before merging a branch Trash update', async ({
    payload,
  }) => {
    const trashEditor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityTrashEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const mainDocument = await payload.create({
      collection: mergeSecurityPagesSlug,
      data: { title: 'main page' },
      overrideAccess: true,
    })
    const branch = await createBranch({ name: 'Denied Trash update', payload })

    await payload.update({
      id: mainDocument.id,
      branch: branch.slug,
      collection: mergeSecurityPagesSlug,
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: true,
    })

    const result = await payload.branches.merge({
      branch: branch.slug,
      dryRun: true,
      overrideAccess: false,
      user: { ...trashEditor, collection: 'users' },
    })

    expect(result.blocked).toHaveLength(1)
    expect(result.blocked[0]).toMatchObject({
      docID: mainDocument.id,
      operation: 'delete',
      reason: 'access',
    })
  })

  test('should report denied delete access before merging a branch-created trashed document', async ({
    payload,
  }) => {
    const trashEditor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityTrashEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const branch = await createBranch({ name: 'Denied trashed create', payload })
    const branchDocument = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityPagesSlug,
      data: {
        deletedAt: new Date().toISOString(),
        title: 'trashed branch page',
      },
      overrideAccess: true,
    })

    const result = await payload.branches.merge({
      branch: branch.slug,
      dryRun: true,
      overrideAccess: false,
      user: { ...trashEditor, collection: 'users' },
    })

    expect(result.blocked).toHaveLength(1)
    expect(result.blocked[0]).toMatchObject({
      docID: branchDocument.id,
      operation: 'delete',
      reason: 'access',
    })
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

  test('should preserve a branch upload replacement while enforcing normal merge access', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Normal access upload replacement', payload })
    const editor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const originalFileData = Buffer.from('normal access original upload bytes')
    const original = await payload.create({
      collection: mergeSecurityUploadsSlug,
      data: { _status: 'published', alt: 'original upload' },
      file: {
        name: 'normal-access-original.txt',
        data: originalFileData,
        mimetype: 'text/plain',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })
    const replacementFileData = Buffer.from('normal access branch replacement bytes')
    const replacement = await payload.update({
      id: original.id,
      branch: branch.slug,
      collection: mergeSecurityUploadsSlug,
      data: { _status: 'published', alt: 'branch replacement' },
      file: {
        name: 'normal-access-branch-replacement.txt',
        data: replacementFileData,
        mimetype: 'text/plain',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })
    const originalFilePath = path.resolve(mergeSecurityUploadsDirectory, original.filename)
    const replacementFilePath = path.resolve(mergeSecurityUploadsDirectory, replacement.filename)
    const loggerError = vi.spyOn(payload.logger, 'error').mockImplementation(() => undefined)
    let loggedErrors: unknown[][] = []

    try {
      await payload.branches.merge({
        branch: branch.slug,
        overrideAccess: false,
        user: { ...editor, collection: 'users' },
      })
    } finally {
      loggedErrors = loggerError.mock.calls
      loggerError.mockRestore()
    }

    const merged = await payload.findByID({
      id: original.id,
      collection: mergeSecurityUploadsSlug,
      overrideAccess: true,
    })

    expect(mergeSecuritySpy.uploadUpdateAccessChecks).toBeGreaterThan(0)
    expect(loggedErrors).toEqual([])
    expect(mergeSecuritySpy.uploadCleanupSourceFilename).toBe(original.filename)
    expect(mergeSecuritySpy.uploadCleanupRetainedFilename).toBe(replacement.filename)
    expect(merged.alt).toBe('branch replacement')
    expect(merged.filename).toBe(replacement.filename)
    expect(fs.existsSync(originalFilePath)).toBe(false)
    expect(fs.readFileSync(replacementFilePath, 'utf8')).toBe(
      'normal access branch replacement bytes',
    )
  })

  test('should preserve a newer draft upload when merging a branch-created document', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Branch create upload drafts', payload })
    const editor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const publishedFileData = Buffer.from('branch-created published upload bytes')
    const published = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityUploadsSlug,
      data: { _status: 'published', alt: 'branch-created published upload' },
      file: {
        name: 'branch-created-published.txt',
        data: publishedFileData,
        mimetype: 'text/plain',
        size: publishedFileData.length,
      },
      overrideAccess: true,
    })
    const draftFileData = Buffer.from('branch-created draft upload bytes')
    const draft = await payload.update({
      id: published.id,
      branch: branch.slug,
      collection: mergeSecurityUploadsSlug,
      data: { alt: 'branch-created draft upload' },
      draft: true,
      file: {
        name: 'branch-created-draft.txt',
        data: draftFileData,
        mimetype: 'text/plain',
        size: draftFileData.length,
      },
      overrideAccess: true,
    })

    await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: false,
      user: { ...editor, collection: 'users' },
    })

    const publishedOnMain = await payload.findByID({
      id: published.id,
      collection: mergeSecurityUploadsSlug,
      draft: false,
      overrideAccess: true,
    })
    const draftOnMain = await payload.findByID({
      id: published.id,
      collection: mergeSecurityUploadsSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(mergeSecuritySpy.uploadUpdateAccessChecks).toBeGreaterThan(0)
    expect(publishedOnMain.filename).toBe(published.filename)
    expect(draftOnMain.filename).toBe(draft.filename)
    expect(
      fs.readFileSync(
        path.resolve(mergeSecurityUploadsDirectory, publishedOnMain.filename),
        'utf8',
      ),
    ).toBe('branch-created published upload bytes')
    expect(
      fs.readFileSync(path.resolve(mergeSecurityUploadsDirectory, draftOnMain.filename), 'utf8'),
    ).toBe('branch-created draft upload bytes')
  })

  test('should ignore an unrelated file on a branch-created upload merge request', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Branch create unrelated merge file', payload })
    const branchFileData = Buffer.from('branch-created persisted upload bytes')
    const branchUpload = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityUploadsSlug,
      data: { alt: 'branch-created persisted upload' },
      file: {
        name: 'branch-created-persisted.txt',
        data: branchFileData,
        mimetype: 'text/plain',
        size: branchFileData.length,
      },
      overrideAccess: true,
    })
    const unrelatedFileData = Buffer.from('unrelated merge request bytes')
    const mergeReq = await createPayloadRequest({ branch: false, payload })

    mergeReq.file = {
      name: 'unrelated-merge-request.txt',
      data: unrelatedFileData,
      mimetype: 'text/plain',
      size: unrelatedFileData.length,
    }

    await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
      req: mergeReq,
    })

    const merged = await payload.findByID({
      id: branchUpload.id,
      collection: mergeSecurityUploadsSlug,
      overrideAccess: true,
    })

    expect(merged.filename).toBe(branchUpload.filename)
    expect(
      fs.readFileSync(path.resolve(mergeSecurityUploadsDirectory, merged.filename), 'utf8'),
    ).toBe('branch-created persisted upload bytes')
    expect(
      fs.existsSync(path.resolve(mergeSecurityUploadsDirectory, 'unrelated-merge-request.txt')),
    ).toBe(false)
  })

  test('should ignore an unrelated file on an existing upload merge request', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Existing upload unrelated merge file', payload })
    const originalFileData = Buffer.from('existing original upload bytes')
    const original = await payload.create({
      collection: mergeSecurityUploadsSlug,
      data: { _status: 'published', alt: 'existing original upload' },
      file: {
        name: 'existing-original-upload.txt',
        data: originalFileData,
        mimetype: 'text/plain',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })
    const branchFileData = Buffer.from('existing branch replacement bytes')
    const replacement = await payload.update({
      id: original.id,
      branch: branch.slug,
      collection: mergeSecurityUploadsSlug,
      data: { _status: 'published', alt: 'existing branch replacement' },
      file: {
        name: 'existing-branch-replacement.txt',
        data: branchFileData,
        mimetype: 'text/plain',
        size: branchFileData.length,
      },
      overrideAccess: true,
    })
    const unrelatedFileData = Buffer.from('unrelated existing merge request bytes')
    const mergeReq = await createPayloadRequest({ branch: false, payload })

    mergeReq.file = {
      name: 'unrelated-existing-merge-request.txt',
      data: unrelatedFileData,
      mimetype: 'text/plain',
      size: unrelatedFileData.length,
    }

    await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
      req: mergeReq,
    })

    const merged = await payload.findByID({
      id: original.id,
      collection: mergeSecurityUploadsSlug,
      overrideAccess: true,
    })

    expect(merged.filename).toBe(replacement.filename)
    expect(
      fs.readFileSync(path.resolve(mergeSecurityUploadsDirectory, merged.filename), 'utf8'),
    ).toBe('existing branch replacement bytes')
    expect(
      fs.existsSync(
        path.resolve(mergeSecurityUploadsDirectory, 'unrelated-existing-merge-request.txt'),
      ),
    ).toBe(false)
  })

  test('should not share trusted branch upload identity with a nested update', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Nested upload identity isolation', payload })
    const editor = await payload.create({
      collection: 'users',
      data: { email: mergeSecurityEditorEmail, password: 'test' },
      overrideAccess: true,
    })
    const nestedFileData = Buffer.from('nested upload original bytes')
    const nestedUpload = await payload.create({
      collection: mergeSecurityUploadsSlug,
      data: { alt: 'nested upload original' },
      file: {
        name: 'nested-upload-original.txt',
        data: nestedFileData,
        mimetype: 'text/plain',
        size: nestedFileData.length,
      },
      overrideAccess: true,
    })
    const mainFileData = Buffer.from('outer upload original bytes')
    const mainUpload = await payload.create({
      collection: mergeSecurityUploadsSlug,
      data: { alt: 'outer upload original' },
      file: {
        name: 'outer-upload-original.txt',
        data: mainFileData,
        mimetype: 'text/plain',
        size: mainFileData.length,
      },
      overrideAccess: true,
    })
    const replacementFileData = Buffer.from('outer branch replacement bytes')
    const replacement = await payload.update({
      id: mainUpload.id,
      branch: branch.slug,
      collection: mergeSecurityUploadsSlug,
      data: { alt: 'outer branch replacement' },
      file: {
        name: 'outer-branch-replacement.txt',
        data: replacementFileData,
        mimetype: 'text/plain',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })

    mergeSecuritySpy.nestedUploadID = nestedUpload.id
    mergeSecuritySpy.nestedUploadTriggerAlt = 'outer branch replacement'

    await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: false,
      user: { ...editor, collection: 'users' },
    })

    const updatedNestedUpload = await payload.findByID({
      id: nestedUpload.id,
      collection: mergeSecurityUploadsSlug,
      overrideAccess: true,
    })

    expect(updatedNestedUpload.alt).toBe('nested upload metadata')
    expect(updatedNestedUpload.filename).toBe(nestedUpload.filename)
    expect(updatedNestedUpload.filename).not.toBe(replacement.filename)
    expect(
      fs.readFileSync(
        path.resolve(mergeSecurityUploadsDirectory, updatedNestedUpload.filename),
        'utf8',
      ),
    ).toBe('nested upload original bytes')
  })

  test('should ignore cloud upload state on a branch merge request', async ({ payload }) => {
    const branch = await createBranch({ name: 'Branch create unrelated cloud file', payload })
    const branchFileData = Buffer.from('branch-created cloud upload bytes')
    const branchUpload = await payload.create({
      branch: branch.slug,
      collection: mergeSecurityCloudUploadsSlug,
      data: { alt: 'branch-created cloud upload' },
      file: {
        name: 'branch-created-cloud.txt',
        data: branchFileData,
        mimetype: 'text/plain',
        size: branchFileData.length,
      },
      overrideAccess: true,
    })
    const unrelatedFileData = Buffer.from('unrelated cloud merge request bytes')
    const mergeReq = await createPayloadRequest({ branch: false, payload })

    mergeSecuritySpy.cloudUploadContents.length = 0
    mergeReq.context._payloadCloudStorage = {
      file: {
        name: 'unrelated-cloud-merge-request.txt',
        data: unrelatedFileData,
        mimetype: 'text/plain',
        size: unrelatedFileData.length,
      },
      uploadSizes: {},
    }

    await payload.branches.merge({
      branch: branch.slug,
      overrideAccess: true,
      req: mergeReq,
    })

    const merged = await payload.findByID({
      id: branchUpload.id,
      collection: mergeSecurityCloudUploadsSlug,
      overrideAccess: true,
    })

    expect(merged.filename).toBe(branchUpload.filename)
    expect(mergeSecuritySpy.cloudUploadContents).toEqual([])
    expect(
      fs.readFileSync(path.resolve(mergeSecurityCloudUploadsDirectory, merged.filename), 'utf8'),
    ).toBe('branch-created cloud upload bytes')
  })

  test('should ignore stale cloud upload state during a bulk metadata update', async ({
    payload,
  }) => {
    const firstFileData = Buffer.from('first bulk cloud original bytes')
    const firstUpload = await payload.create({
      collection: mergeSecurityCloudUploadsSlug,
      data: { alt: 'a first bulk cloud upload' },
      file: {
        name: 'first-bulk-cloud-original.txt',
        data: firstFileData,
        mimetype: 'text/plain',
        size: firstFileData.length,
      },
      overrideAccess: true,
    })
    const secondFileData = Buffer.from('second bulk cloud original bytes')
    const secondUpload = await payload.create({
      collection: mergeSecurityCloudUploadsSlug,
      data: { alt: 'b second bulk cloud upload' },
      file: {
        name: 'second-bulk-cloud-original.txt',
        data: secondFileData,
        mimetype: 'text/plain',
        size: secondFileData.length,
      },
      overrideAccess: true,
    })
    const unrelatedFileData = Buffer.from('unrelated bulk cloud request bytes')
    const req = await createPayloadRequest({ payload })

    mergeSecuritySpy.cloudUploadContents.length = 0
    req.context._payloadCloudStorage = {
      file: {
        name: 'unrelated-bulk-cloud-request.txt',
        data: unrelatedFileData,
        mimetype: 'text/plain',
        size: unrelatedFileData.length,
      },
      uploadSizes: {},
    }

    const result = await payload.update({
      collection: mergeSecurityCloudUploadsSlug,
      data: { alt: 'bulk cloud metadata replacement' },
      overrideAccess: true,
      req,
      sort: 'alt',
      where: { id: { in: [firstUpload.id, secondUpload.id] } },
    })

    expect(result.docs).toHaveLength(2)
    expect(result.errors).toEqual([])
    expect(mergeSecuritySpy.cloudUploadContents).toEqual([])
    expect(
      fs.readFileSync(
        path.resolve(mergeSecurityCloudUploadsDirectory, firstUpload.filename),
        'utf8',
      ),
    ).toBe('first bulk cloud original bytes')
    expect(
      fs.readFileSync(
        path.resolve(mergeSecurityCloudUploadsDirectory, secondUpload.filename),
        'utf8',
      ),
    ).toBe('second bulk cloud original bytes')
  })

  test('should preserve a real bulk cloud replacement in an isolated request', async ({
    payload,
  }) => {
    const originalFileData = Buffer.from('bulk cloud isolated original bytes')
    const upload = await payload.create({
      collection: mergeSecurityCloudUploadsSlug,
      data: { alt: 'bulk cloud isolated original' },
      file: {
        name: 'bulk-cloud-isolated-original.txt',
        data: originalFileData,
        mimetype: 'text/plain',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })
    const replacementFileData = Buffer.from('bulk cloud isolated replacement bytes')
    const req = await createPayloadRequest({ payload })

    mergeSecuritySpy.cloudUploadContents.length = 0

    const result = await payload.update({
      collection: mergeSecurityCloudUploadsSlug,
      data: { alt: 'bulk cloud isolated replacement' },
      file: {
        name: 'bulk-cloud-isolated-replacement.txt',
        data: replacementFileData,
        mimetype: 'text/plain',
        size: replacementFileData.length,
      },
      overrideAccess: true,
      req,
      where: { id: { equals: upload.id } },
    })

    expect(result.docs).toHaveLength(1)
    expect(result.errors).toEqual([])
    expect(mergeSecuritySpy.cloudUploadContents).toEqual(['bulk cloud isolated replacement bytes'])
  })
})
