/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test", "test.options"] }] -- Tests use the shared fixture wrapper. */

import type { Payload } from 'payload'

import fs from 'fs'
import path from 'path'
import { commitTransaction, createPayloadRequest, initTransaction, killTransaction } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  databaseAdapterSupportsTransactions,
  isPostgresDatabaseAdapter,
} from '../__helpers/shared/databaseAdapterCapabilities.js'
import { mongooseList } from '../__helpers/shared/isMongoose.js'
import {
  deletionSafetyBranchGlobalSlug,
  deletionSafetyGlobalSlug,
  deletionSafetyMediaDirectory,
  deletionSafetyMediaSlug,
  deletionSafetyOwnersSlug,
  deletionSafetyTargetsSlug,
  deletionSafetyVersionedGlobalSlug,
  deletionSafetyVersionedTargetsSlug,
} from './deletion-safety.config.js'
import { deletionSafetySpy, resetDeletionSafetySpy } from './deletionSafetySpy.js'
import { branchChangesSlug, branchesSlug } from './shared.js'

const branchReferenceErrorMessage =
  'Branch-created content cannot be deleted while a surviving document or version references it.'
const transactionCapableMongooseAdapters = new Set(
  mongooseList.filter((adapter) => databaseAdapterSupportsTransactions({ adapter })),
)

const getRelationshipID = (value: unknown): unknown =>
  typeof value === 'object' && value !== null && 'id' in value
    ? (value as { id: unknown }).id
    : value

const createBranch = async ({ name, payload }: { name: string; payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name },
    overrideAccess: true,
  })

const createBranchTarget = async ({ branch, payload }: { branch: string; payload: Payload }) =>
  payload.create({
    branch,
    collection: deletionSafetyTargetsSlug,
    data: { title: `target on ${branch}` },
    overrideAccess: true,
  })

const createTrashedBranchOwner = async ({
  branchName,
  payload,
}: {
  branchName: string
  payload: Payload
}) => {
  const mainOwner = await payload.create({
    collection: deletionSafetyOwnersSlug,
    data: { title: 'main owner' },
    overrideAccess: true,
  })
  const branch = await createBranch({ name: branchName, payload })

  await payload.update({
    id: mainOwner.id,
    branch: branch.slug,
    collection: deletionSafetyOwnersSlug,
    data: {
      deletedAt: new Date().toISOString(),
      title: 'trashed branch owner',
    },
    overrideAccess: true,
  })

  return { branch, mainOwner }
}

const findCreateChange = async ({
  branch,
  docID,
  payload,
}: {
  branch: string
  docID: number | string
  payload: Payload
}) => {
  const changes = await payload.find({
    collection: branchChangesSlug,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { branch: { equals: branch } },
        { operation: { equals: 'create' } },
        { 'doc.value': { equals: docID } },
      ],
    },
  })

  return changes.docs[0]
}

const expectTargetToRemain = async ({
  id,
  branch,
  payload,
}: {
  branch: string
  id: number | string
  payload: Payload
}) => {
  const target = await payload.findByID({
    id,
    branch,
    collection: deletionSafetyTargetsSlug,
    disableErrors: true,
    overrideAccess: true,
  })

  expect(target?.id).toBe(id)
}

const expectBranchDeleteToHaveRolledBack = async ({
  id,
  branch,
  payload,
}: {
  branch: string
  id: number | string
  payload: Payload
}) => {
  const branchTarget = await payload.findByID({
    id,
    branch,
    collection: deletionSafetyTargetsSlug,
    disableErrors: true,
    overrideAccess: true,
  })
  const branchShadows = await payload.find({
    branch: false,
    collection: deletionSafetyTargetsSlug,
    overrideAccess: true,
    pagination: false,
    showHiddenFields: true,
    where: {
      and: [{ _branch: { equals: branch } }, { _branchDocID: { equals: id } }],
    },
  })
  const branchChanges = await payload.find({
    collection: branchChangesSlug,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ branch: { equals: branch } }, { 'doc.value': { equals: id } }],
    },
  })

  expect(branchTarget?.id).toBe(id)
  expect(branchShadows.docs).toHaveLength(0)
  expect(branchChanges.docs).toHaveLength(0)
}

test.suite('Branch deletion safety', { config: './deletion-safety.config.ts' }, () => {
  test.beforeEach(() => {
    resetDeletionSafetySpy()
  })

  test.afterEach(async () => {
    await fs.promises.rm(deletionSafetyMediaDirectory, { force: true, recursive: true })
  })

  test('should block branch deletion when a main row references branch-created content without running read hooks or config select', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Referenced by main', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })

    await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: { target: target.id, title: 'main owner' },
      overrideAccess: true,
    })
    resetDeletionSafetySpy()

    await expect(
      payload.delete({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })

    expect(deletionSafetySpy.ownerBeforeReadCount).toBe(0)
    await expectTargetToRemain({ id: target.id, branch: branch.slug, payload })
  })

  test('should block a selected create discard when another branch row references its target', async ({
    payload,
  }) => {
    const targetBranch = await createBranch({ name: 'Target branch', payload })
    const ownerBranch = await createBranch({ name: 'Owner branch', payload })
    const target = await createBranchTarget({ branch: targetBranch.slug, payload })

    await payload.create({
      branch: ownerBranch.slug,
      collection: deletionSafetyOwnersSlug,
      data: { target: target.id, title: 'other branch owner' },
      overrideAccess: true,
    })

    const createChange = await findCreateChange({
      branch: targetBranch.slug,
      docID: target.id,
      payload,
    })

    await expect(
      payload.branches.discard({
        branch: targetBranch.slug,
        changes: [createChange.id],
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })

    await expectTargetToRemain({ id: target.id, branch: targetBranch.slug, payload })
  })

  test('should block discard when a trashed main row references branch-created content', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Referenced by trash', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })
    const owner = await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: { target: target.id, title: 'trashed owner' },
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      collection: deletionSafetyOwnersSlug,
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: true,
    })

    await expect(
      payload.branches.discard({ branch: branch.slug, overrideAccess: true }),
    ).rejects.toMatchObject({ status: 409 })

    await expectTargetToRemain({ id: target.id, branch: branch.slug, payload })
  })

  test('should keep a trashed branch copy from revealing its inherited main document', async ({
    payload,
  }) => {
    const { branch, mainOwner } = await createTrashedBranchOwner({
      branchName: 'Trashed branch copy',
      payload,
    })

    const defaultBranchDocument = await payload.findByID({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      disableErrors: true,
      overrideAccess: true,
    })
    const trashedBranchDocument = await payload.findByID({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
      trash: true,
    })
    const mainDocument = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })

    expect(defaultBranchDocument).toBeNull()
    expect(trashedBranchDocument.title).toBe('trashed branch owner')
    expect(mainDocument.title).toBe('main owner')
  })

  test('should restore a trashed branch copy without changing main', async ({ payload }) => {
    const { branch, mainOwner } = await createTrashedBranchOwner({
      branchName: 'Restore trashed branch copy',
      payload,
    })

    await payload.update({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      data: { deletedAt: null },
      overrideAccess: true,
      trash: true,
    })

    const restoredBranchDocument = await payload.findByID({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })
    const mainDocument = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })

    expect(restoredBranchDocument.title).toBe('trashed branch owner')
    expect(mainDocument.title).toBe('main owner')
  })

  test('should reveal main after discarding a trashed branch copy', async ({ payload }) => {
    const { branch, mainOwner } = await createTrashedBranchOwner({
      branchName: 'Discard trashed branch copy',
      payload,
    })

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    const inheritedBranchDocument = await payload.findByID({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })
    const branchRows = await payload.db.find({
      branch: false,
      collection: deletionSafetyOwnersSlug,
      pagination: false,
      where: { _branch: { equals: branch.slug } },
    })

    expect(inheritedBranchDocument.title).toBe('main owner')
    expect(branchRows.docs).toHaveLength(0)
  })

  test('should keep main after permanently deleting a trashed branch copy', async ({ payload }) => {
    const { branch, mainOwner } = await createTrashedBranchOwner({
      branchName: 'Permanently delete trashed branch copy',
      payload,
    })

    await payload.delete({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
      trash: true,
    })

    const deletedBranchDocument = await payload.findByID({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      disableErrors: true,
      overrideAccess: true,
      trash: true,
    })
    const mainDocument = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })

    expect(deletedBranchDocument).toBeNull()
    expect(mainDocument.title).toBe('main owner')

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    const inheritedBranchDocument = await payload.findByID({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })

    expect(inheritedBranchDocument.title).toBe('main owner')
  })

  test('should apply a trashed branch copy to main on merge', async ({ payload }) => {
    const { branch, mainOwner } = await createTrashedBranchOwner({
      branchName: 'Merge trashed branch copy',
      payload,
    })

    await payload.branches.merge({ branch: branch.slug, overrideAccess: true })

    const defaultMainDocument = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      disableErrors: true,
      overrideAccess: true,
    })
    const trashedMainDocument = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
      trash: true,
    })
    const trashedMainDraft = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      draft: true,
      overrideAccess: true,
      trash: true,
    })

    expect(defaultMainDocument).toBeNull()
    expect(trashedMainDocument.title).toBe('main owner')
    expect(trashedMainDraft.title).toBe('trashed branch owner')
  })

  test('should restore a trashed main document through a branch merge', async ({ payload }) => {
    const mainOwner = await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: {
        deletedAt: new Date().toISOString(),
        title: 'trashed main owner',
      },
      overrideAccess: true,
    })
    const branch = await createBranch({ name: 'Restore main through branch', payload })

    await payload.update({
      id: mainOwner.id,
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      data: {
        deletedAt: null,
        title: 'restored branch owner',
      },
      overrideAccess: true,
      trash: true,
    })

    await payload.branches.merge({ branch: branch.slug, overrideAccess: true })

    const restoredMainDocument = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
    })
    const restoredMainDraft = await payload.findByID({
      id: mainOwner.id,
      collection: deletionSafetyOwnersSlug,
      draft: true,
      overrideAccess: true,
    })

    expect(restoredMainDocument.title).toBe('trashed main owner')
    expect(restoredMainDraft.title).toBe('restored branch owner')
  })

  test('should merge a branch-created trashed document without exposing it', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Create trashed document', payload })
    const branchOwner = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyOwnersSlug,
      data: {
        deletedAt: new Date().toISOString(),
        title: 'branch-created trashed owner',
      },
      overrideAccess: true,
    })

    await payload.branches.merge({ branch: branch.slug, overrideAccess: true })

    const defaultMainDocument = await payload.findByID({
      id: branchOwner.id,
      collection: deletionSafetyOwnersSlug,
      disableErrors: true,
      overrideAccess: true,
    })
    const trashedMainDocument = await payload.findByID({
      id: branchOwner.id,
      collection: deletionSafetyOwnersSlug,
      overrideAccess: true,
      trash: true,
    })

    expect(defaultMainDocument).toBeNull()
    expect(trashedMainDocument.title).toBe('branch-created trashed owner')
  })

  test('should block direct deletion when the raw main global references branch-created content', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Referenced by global', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })

    await payload.updateGlobal({
      slug: deletionSafetyGlobalSlug,
      branch: false,
      data: { target: target.id },
      overrideAccess: true,
    })
    resetDeletionSafetySpy()

    await expect(
      payload.delete({
        id: target.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ status: 409 })

    expect(deletionSafetySpy.globalBeforeReadCount).toBe(0)
    await expectTargetToRemain({ id: target.id, branch: branch.slug, payload })
  })

  test('should allow direct deletion when only the branch-created target itself references it', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Self-referencing target', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })

    await payload.update({
      id: target.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      data: { relatedTarget: target.id },
      overrideAccess: true,
    })

    await payload.delete({
      id: target.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
    })

    const remainingTarget = await payload.db.findOne({
      branch: false,
      collection: deletionSafetyTargetsSlug,
      where: {
        and: [{ id: { equals: target.id } }, { _branch: { equals: branch.slug } }],
      },
    })

    expect(remainingTarget).toBeNull()
  })

  test('should block a selected create discard when another branch global references its target', async ({
    payload,
  }) => {
    const targetBranch = await createBranch({ name: 'Global target branch', payload })
    const ownerBranch = await createBranch({ name: 'Global owner branch', payload })
    const target = await createBranchTarget({ branch: targetBranch.slug, payload })

    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: false,
      data: { target: null },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: ownerBranch.slug,
      data: { target: target.id },
      overrideAccess: true,
    })

    const mainGlobal = await payload.findGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: 'main',
      overrideAccess: true,
    })
    const ownerGlobal = await payload.findGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: ownerBranch.slug,
      overrideAccess: true,
    })

    expect(getRelationshipID(mainGlobal.target)).not.toBe(target.id)
    expect(getRelationshipID(ownerGlobal.target)).toBe(target.id)

    const createChange = await findCreateChange({
      branch: targetBranch.slug,
      docID: target.id,
      payload,
    })

    await expect(
      payload.branches.discard({
        branch: targetBranch.slug,
        changes: [createChange.id],
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })

    await expectTargetToRemain({ id: target.id, branch: targetBranch.slug, payload })
  })

  test('should not ignore an unselected global owner during a selected create discard', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Unselected global owner', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })

    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: false,
      data: { target: null },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: branch.slug,
      data: { target: target.id },
      overrideAccess: true,
    })

    const mainGlobal = await payload.findGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: 'main',
      overrideAccess: true,
    })
    const ownerGlobal = await payload.findGlobal({
      slug: deletionSafetyBranchGlobalSlug,
      branch: branch.slug,
      overrideAccess: true,
    })

    expect(getRelationshipID(mainGlobal.target)).not.toBe(target.id)
    expect(getRelationshipID(ownerGlobal.target)).toBe(target.id)

    const createChange = await findCreateChange({
      branch: branch.slug,
      docID: target.id,
      payload,
    })

    await expect(
      payload.branches.discard({
        branch: branch.slug,
        changes: [createChange.id],
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })

    await expectTargetToRemain({ id: target.id, branch: branch.slug, payload })
  })

  test('should remove a branch-created target and its branch global version chain together', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Owned global history', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })

    await payload.updateGlobal({
      slug: deletionSafetyVersionedGlobalSlug,
      branch: false,
      data: { target: null },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: deletionSafetyVersionedGlobalSlug,
      branch: branch.slug,
      data: { target: target.id },
      overrideAccess: true,
    })

    const versionsBeforeDeletion = await payload.db.findGlobalVersions({
      branch: false,
      global: deletionSafetyVersionedGlobalSlug,
      pagination: false,
      where: { _branch: { equals: branch.slug } },
    })

    expect(versionsBeforeDeletion.docs.length).toBeGreaterThan(0)

    await payload.delete({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })

    const remainingTarget = await payload.db.findOne({
      branch: false,
      collection: deletionSafetyTargetsSlug,
      where: {
        and: [{ id: { equals: target.id } }, { _branch: { equals: branch.slug } }],
      },
    })
    const remainingGlobal = await payload.db.findGlobal({
      slug: deletionSafetyVersionedGlobalSlug,
      branch: false,
      where: { _branch: { equals: branch.slug } },
    })
    const remainingGlobalVersions = await payload.db.findGlobalVersions({
      branch: false,
      global: deletionSafetyVersionedGlobalSlug,
      pagination: false,
      where: { _branch: { equals: branch.slug } },
    })

    expect(remainingTarget).toBeNull()
    expect(Object.keys(remainingGlobal ?? {})).toHaveLength(0)
    expect(remainingGlobalVersions.docs).toHaveLength(0)
  })

  test('should remove a merged branch global version chain without removing main history', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Merged global history', payload })
    const mainTarget = await payload.create({
      collection: deletionSafetyTargetsSlug,
      data: { title: 'main merge target' },
      overrideAccess: true,
    })

    await payload.updateGlobal({
      slug: deletionSafetyVersionedGlobalSlug,
      branch: false,
      data: { target: null },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: deletionSafetyVersionedGlobalSlug,
      branch: branch.slug,
      data: { target: mainTarget.id },
      overrideAccess: true,
    })

    const branchVersionsBeforeMerge = await payload.db.findGlobalVersions({
      branch: false,
      global: deletionSafetyVersionedGlobalSlug,
      pagination: false,
      where: { _branch: { equals: branch.slug } },
    })

    expect(branchVersionsBeforeMerge.docs.length).toBeGreaterThan(0)

    await payload.branches.merge({ branch: branch.slug, overrideAccess: true })

    const branchVersionsAfterMerge = await payload.db.findGlobalVersions({
      branch: false,
      global: deletionSafetyVersionedGlobalSlug,
      pagination: false,
      where: { _branch: { equals: branch.slug } },
    })
    const mainVersionsAfterMerge = await payload.db.findGlobalVersions({
      branch: false,
      global: deletionSafetyVersionedGlobalSlug,
      pagination: false,
      where: { _branch: { equals: 'main' } },
    })

    expect(branchVersionsAfterMerge.docs).toHaveLength(0)
    expect(mainVersionsAfterMerge.docs.length).toBeGreaterThan(0)
  })

  test('should block discard while a historical version references branch-created content', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Referenced by history', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })
    const owner = await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: { target: target.id, title: 'historical owner' },
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: owner.id,
      collection: deletionSafetyOwnersSlug,
      data: { target: null, title: 'current owner' },
      draft: true,
      overrideAccess: true,
    })

    await expect(
      payload.branches.discard({ branch: branch.slug, overrideAccess: true }),
    ).rejects.toMatchObject({ status: 409 })

    await expectTargetToRemain({ id: target.id, branch: branch.slug, payload })
  })

  test('should run upload cleanup when discarding an upload created on a branch', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Upload cleanup', payload })
    const fileData = Buffer.from('branch upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'branch upload' },
      file: {
        name: 'branch-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)

    expect(fs.existsSync(filePath)).toBe(true)
    resetDeletionSafetySpy()

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    expect(fs.existsSync(filePath)).toBe(false)
    expect(deletionSafetySpy.uploadAfterDeleteCount).toBe(1)
  })

  test('should remove a draft-only replacement file when discarding a branch upload edit', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Draft upload cleanup', payload })
    const mainFileData = Buffer.from('main upload bytes')
    const mainUpload = await payload.create({
      collection: deletionSafetyMediaSlug,
      data: { alt: 'main upload' },
      file: {
        name: 'main-upload.txt',
        data: mainFileData,
        mimetype: 'text/plain',
        size: mainFileData.length,
      },
      overrideAccess: true,
    })
    const draftFileData = Buffer.from('branch draft upload bytes')
    const draftUpload = await payload.update({
      id: mainUpload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'branch draft upload' },
      draft: true,
      file: {
        name: 'branch-draft-upload.txt',
        data: draftFileData,
        mimetype: 'text/plain',
        size: draftFileData.length,
      },
      overrideAccess: true,
    })
    const mainFilePath = path.resolve(deletionSafetyMediaDirectory, mainUpload.filename)
    const draftFilePath = path.resolve(deletionSafetyMediaDirectory, draftUpload.filename)
    const mainUploadAfterUpdate = await payload.findByID({
      id: mainUpload.id,
      branch: false,
      collection: deletionSafetyMediaSlug,
      draft: true,
      overrideAccess: true,
    })
    const branchDraftAfterUpdate = await payload.findByID({
      id: mainUpload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      draft: true,
      overrideAccess: true,
    })
    const branchVersionsAfterUpdate = await payload.findVersions({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
      pagination: false,
    })

    expect(mainUploadAfterUpdate).toMatchObject({
      alt: 'main upload',
      filename: mainUpload.filename,
    })
    expect(branchDraftAfterUpdate).toMatchObject({
      alt: 'branch draft upload',
      filename: draftUpload.filename,
    })
    expect(
      branchVersionsAfterUpdate.docs.some(
        ({ version }) =>
          version.alt === 'branch draft upload' && version.filename === draftUpload.filename,
      ),
    ).toBe(true)
    expect(fs.existsSync(mainFilePath)).toBe(true)
    expect(fs.existsSync(draftFilePath)).toBe(true)

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    expect(fs.existsSync(mainFilePath)).toBe(true)
    expect(fs.existsSync(draftFilePath)).toBe(false)
  })

  test('should persist a first branch upload replacement without changing main', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'First upload replacement', payload })
    const mainFileData = Buffer.from('published main upload bytes')
    const mainUpload = await payload.create({
      collection: deletionSafetyMediaSlug,
      data: { _status: 'published', alt: 'published main upload' },
      file: {
        name: 'published-main-upload.txt',
        data: mainFileData,
        mimetype: 'text/plain',
        size: mainFileData.length,
      },
      overrideAccess: true,
    })
    const replacementFileData = Buffer.from('published branch replacement bytes')
    const branchUpload = await payload.update({
      id: mainUpload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { _status: 'published', alt: 'published branch replacement' },
      file: {
        name: 'published-branch-replacement.txt',
        data: replacementFileData,
        mimetype: 'text/plain',
        size: replacementFileData.length,
      },
      overrideAccess: true,
    })
    const mainUploadAfterUpdate = await payload.findByID({
      id: mainUpload.id,
      branch: false,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
    })
    const branchUploadAfterUpdate = await payload.findByID({
      id: mainUpload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
    })
    const branchShadow = await payload.db.findOne({
      branch: false,
      collection: deletionSafetyMediaSlug,
      where: {
        and: [{ _branch: { equals: branch.slug } }, { _branchDocID: { equals: mainUpload.id } }],
      },
    })
    const branchVersionsAfterUpdate = await payload.findVersions({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
      pagination: false,
    })
    const mainFilePath = path.resolve(deletionSafetyMediaDirectory, mainUpload.filename)
    const branchFilePath = path.resolve(deletionSafetyMediaDirectory, branchUpload.filename)

    expect(mainUploadAfterUpdate).toMatchObject({
      alt: 'published main upload',
      filename: mainUpload.filename,
    })
    expect(branchUploadAfterUpdate).toMatchObject({
      alt: 'published branch replacement',
      filename: branchUpload.filename,
    })
    expect(branchShadow).toMatchObject({
      _branch: branch.slug,
      _branchDocID: mainUpload.id,
      alt: 'published branch replacement',
      filename: branchUpload.filename,
    })
    expect(
      branchVersionsAfterUpdate.docs.some(
        ({ version }) =>
          version.alt === 'published branch replacement' &&
          version.filename === branchUpload.filename,
      ),
    ).toBe(true)
    expect(fs.existsSync(mainFilePath)).toBe(true)
    expect(fs.existsSync(branchFilePath)).toBe(true)
  })

  test.options(
    'should clear a rolled-back first branch update before reusing the request',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const mainTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'same request main target' },
        overrideAccess: true,
      })
      const branch = await createBranch({ name: 'Same request retry', payload })
      const req = await createPayloadRequest({ branch: branch.slug, payload })

      deletionSafetySpy.rejectTargetAfterChangeID = mainTarget.id

      await expect(
        payload.update({
          id: mainTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          data: { title: 'rejected branch update' },
          overrideAccess: true,
          req,
        }),
      ).rejects.toThrow('Rejected target after change')

      const branchAfterFailure = await payload.findByID({
        id: mainTarget.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        overrideAccess: true,
        req,
      })
      const shadowsAfterFailure = await payload.find({
        branch: false,
        collection: deletionSafetyTargetsSlug,
        overrideAccess: true,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: branch.slug } }, { _branchDocID: { equals: mainTarget.id } }],
        },
      })
      const changesAfterFailure = await payload.find({
        collection: branchChangesSlug,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [{ branch: { equals: branch.slug } }, { 'doc.value': { equals: mainTarget.id } }],
        },
      })

      expect(branchAfterFailure.title).toBe('same request main target')
      expect(shadowsAfterFailure.docs).toHaveLength(0)
      expect(changesAfterFailure.docs).toHaveLength(0)

      deletionSafetySpy.rejectTargetAfterChangeID = undefined

      const retriedUpdate = await payload.update({
        id: mainTarget.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        data: { title: 'successful branch retry' },
        overrideAccess: true,
        req,
      })
      const mainAfterRetry = await payload.findByID({
        id: mainTarget.id,
        branch: false,
        collection: deletionSafetyTargetsSlug,
        overrideAccess: true,
      })
      const shadowsAfterRetry = await payload.find({
        branch: false,
        collection: deletionSafetyTargetsSlug,
        overrideAccess: true,
        pagination: false,
        showHiddenFields: true,
        where: {
          and: [{ _branch: { equals: branch.slug } }, { _branchDocID: { equals: mainTarget.id } }],
        },
      })
      const changesAfterRetry = await payload.find({
        collection: branchChangesSlug,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [{ branch: { equals: branch.slug } }, { 'doc.value': { equals: mainTarget.id } }],
        },
      })

      expect(retriedUpdate.title).toBe('successful branch retry')
      expect(mainAfterRetry.title).toBe('same request main target')
      expect(shadowsAfterRetry.docs).toHaveLength(1)
      expect(shadowsAfterRetry.docs[0]?.title).toBe('successful branch retry')
      expect(changesAfterRetry.docs).toHaveLength(1)
    },
  )

  test.options(
    'should reject an untouched branch update inside a caller transaction without side effects',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const mainTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'caller transaction main target' },
        overrideAccess: true,
      })
      const branch = await createBranch({ name: 'Caller transaction first update', payload })
      const req = await createPayloadRequest({ branch: branch.slug, payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      try {
        await expect(
          payload.update({
            id: mainTarget.id,
            branch: branch.slug,
            collection: deletionSafetyTargetsSlug,
            data: { title: 'rejected caller transaction update' },
            overrideAccess: true,
            req,
          }),
        ).rejects.toMatchObject({
          message: 'Cannot update an untouched branch document within an existing transaction.',
          status: 409,
        })

        expect(req.transactionID).toBe(callerTransactionID)

        const shadowRows = await payload.find({
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [
              { _branch: { equals: branch.slug } },
              { _branchDocID: { equals: mainTarget.id } },
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
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should update an existing branch shadow inside a caller transaction',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const mainTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'existing shadow main target' },
        overrideAccess: true,
      })
      const branch = await createBranch({ name: 'Caller transaction existing shadow', payload })

      await payload.update({
        id: mainTarget.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        data: { title: 'existing branch shadow' },
        overrideAccess: true,
      })

      const req = await createPayloadRequest({ branch: branch.slug, payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      try {
        const result = await payload.update({
          id: mainTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          data: { title: 'caller transaction branch update' },
          overrideAccess: true,
          req,
        })

        expect(result.title).toBe('caller transaction branch update')
        expect(req.transactionID).toBe(callerTransactionID)

        await commitTransaction(req)

        const mainAfterUpdate = await payload.findByID({
          id: mainTarget.id,
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const branchAfterUpdate = await payload.findByID({
          id: mainTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(mainAfterUpdate.title).toBe('existing shadow main target')
        expect(branchAfterUpdate.title).toBe('caller transaction branch update')
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should reject only untouched branch documents during a caller-owned bulk update',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Caller transaction bulk update', payload })
      const existingShadowTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'a existing shadow main target' },
        overrideAccess: true,
      })
      const untouchedTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'b untouched main target' },
        overrideAccess: true,
      })

      await payload.update({
        id: existingShadowTarget.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        data: { title: 'existing branch shadow' },
        overrideAccess: true,
      })

      const req = await createPayloadRequest({ branch: branch.slug, payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID

      expect(didStartTransaction).toBe(true)

      try {
        const result = await payload.update({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          data: { title: 'caller transaction bulk replacement' },
          overrideAccess: true,
          req,
          sort: 'title',
          where: { id: { in: [existingShadowTarget.id, untouchedTarget.id] } },
        })

        expect(result.docs).toHaveLength(1)
        expect(result.errors).toHaveLength(1)
        expect(String(result.errors[0]?.id)).toBe(String(untouchedTarget.id))
        expect(result.errors[0]?.message).toBe(
          'Cannot update an untouched branch document within an existing transaction.',
        )
        expect(req.transactionID).toBe(callerTransactionID)

        await commitTransaction(req)

        const mainExistingShadowTarget = await payload.findByID({
          id: existingShadowTarget.id,
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const branchExistingShadowTarget = await payload.findByID({
          id: existingShadowTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const branchUntouchedTarget = await payload.findByID({
          id: untouchedTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const untouchedShadows = await payload.find({
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [
              { _branch: { equals: branch.slug } },
              { _branchDocID: { equals: untouchedTarget.id } },
            ],
          },
        })
        const untouchedChanges = await payload.find({
          collection: branchChangesSlug,
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              { branch: { equals: branch.slug } },
              { 'doc.value': { equals: untouchedTarget.id } },
            ],
          },
        })

        expect(mainExistingShadowTarget.title).toBe('a existing shadow main target')
        expect(branchExistingShadowTarget.title).toBe('caller transaction bulk replacement')
        expect(branchUntouchedTarget.title).toBe('b untouched main target')
        expect(untouchedShadows.docs).toHaveLength(0)
        expect(untouchedChanges.docs).toHaveLength(0)
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test('should remove a draft file when discarding a branch-created upload', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Branch-created draft upload cleanup', payload })
    const publishedFileData = Buffer.from('branch published upload bytes')
    const publishedUpload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'branch published upload' },
      file: {
        name: 'branch-published-upload.txt',
        data: publishedFileData,
        mimetype: 'text/plain',
        size: publishedFileData.length,
      },
      overrideAccess: true,
    })
    const draftFileData = Buffer.from('branch-created draft upload bytes')
    const draftUpload = await payload.update({
      id: publishedUpload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'branch-created draft upload' },
      draft: true,
      file: {
        name: 'branch-created-draft-upload.txt',
        data: draftFileData,
        mimetype: 'text/plain',
        size: draftFileData.length,
      },
      overrideAccess: true,
    })
    const publishedFilePath = path.resolve(deletionSafetyMediaDirectory, publishedUpload.filename)
    const draftFilePath = path.resolve(deletionSafetyMediaDirectory, draftUpload.filename)

    expect(fs.existsSync(draftFilePath)).toBe(true)

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    expect(fs.existsSync(publishedFilePath)).toBe(false)
    expect(fs.existsSync(draftFilePath)).toBe(false)
  })

  test('should preserve main document preferences when deleting it on a branch', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Single delete preference', payload })
    const target = await payload.create({
      collection: deletionSafetyTargetsSlug,
      data: { title: 'main target with preference' },
      overrideAccess: true,
    })
    const user = await payload.create({
      collection: 'users',
      data: { email: 'single-delete-preference@example.com', password: 'test' },
      overrideAccess: true,
    })
    const preference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${deletionSafetyTargetsSlug}-${target.id}`,
        value: { test: true },
      },
      overrideAccess: true,
      user: { ...user, collection: 'users' },
    })

    await payload.delete({
      id: target.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
    })

    const mainTarget = await payload.findByID({
      id: target.id,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
    })
    const remainingPreference = await payload.findByID({
      id: preference.id,
      collection: 'payload-preferences',
      overrideAccess: true,
    })

    expect(mainTarget.id).toBe(target.id)
    expect(remainingPreference.id).toBe(preference.id)

    await payload.branches.discard({ branch: branch.slug, overrideAccess: true })

    const preferenceAfterDiscard = await payload.findByID({
      id: preference.id,
      collection: 'payload-preferences',
      overrideAccess: true,
    })

    expect(preferenceAfterDiscard.id).toBe(preference.id)
  })

  test('should preserve main document preferences during a bulk branch delete', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Bulk delete preference', payload })
    const target = await payload.create({
      collection: deletionSafetyTargetsSlug,
      data: { title: 'bulk target with preference' },
      overrideAccess: true,
    })
    const user = await payload.create({
      collection: 'users',
      data: { email: 'bulk-delete-preference@example.com', password: 'test' },
      overrideAccess: true,
    })
    const preference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${deletionSafetyTargetsSlug}-${target.id}`,
        value: { test: true },
      },
      overrideAccess: true,
      user: { ...user, collection: 'users' },
    })

    const result = await payload.delete({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
      where: { id: { equals: target.id } },
    })
    const remainingPreference = await payload.findByID({
      id: preference.id,
      collection: 'payload-preferences',
      overrideAccess: true,
    })

    expect(result.docs).toHaveLength(1)
    expect(result.errors).toEqual([])
    expect(remainingPreference.id).toBe(preference.id)
  })

  test('should remove preferences when deleting a branch-created document', async ({ payload }) => {
    const branch = await createBranch({ name: 'Branch-created delete preference', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })
    const user = await payload.create({
      collection: 'users',
      data: { email: 'branch-created-delete-preference@example.com', password: 'test' },
      overrideAccess: true,
    })
    const preference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${deletionSafetyTargetsSlug}-${target.id}`,
        value: { test: true },
      },
      overrideAccess: true,
      user: { ...user, collection: 'users' },
    })

    await payload.delete({
      id: target.id,
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
    })

    const remainingPreferences = await payload.find({
      collection: 'payload-preferences',
      overrideAccess: true,
      pagination: false,
      where: { id: { equals: preference.id } },
    })

    expect(remainingPreferences.docs).toHaveLength(0)
  })

  test('should remove only branch-created preferences during a mixed bulk branch delete', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Mixed bulk delete preference', payload })
    const mainTarget = await payload.create({
      collection: deletionSafetyTargetsSlug,
      data: { title: 'mixed bulk main target' },
      overrideAccess: true,
    })
    const branchCreatedTarget = await createBranchTarget({ branch: branch.slug, payload })
    const user = await payload.create({
      collection: 'users',
      data: { email: 'mixed-bulk-delete-preference@example.com', password: 'test' },
      overrideAccess: true,
    })
    const mainPreference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${deletionSafetyTargetsSlug}-${mainTarget.id}`,
        value: { test: true },
      },
      overrideAccess: true,
      user: { ...user, collection: 'users' },
    })
    const branchCreatedPreference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${deletionSafetyTargetsSlug}-${branchCreatedTarget.id}`,
        value: { test: true },
      },
      overrideAccess: true,
      user: { ...user, collection: 'users' },
    })

    const result = await payload.delete({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
      where: { id: { in: [mainTarget.id, branchCreatedTarget.id] } },
    })
    const remainingPreferences = await payload.find({
      collection: 'payload-preferences',
      overrideAccess: true,
      pagination: false,
      where: { id: { in: [mainPreference.id, branchCreatedPreference.id] } },
    })

    expect(result.docs).toHaveLength(2)
    expect(result.errors).toEqual([])
    expect(remainingPreferences.docs.map(({ id }) => id)).toEqual([mainPreference.id])
  })

  test('should use the final selected branch document for bulk delete results and hooks', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Bulk delete final target', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })
    const titleAfterHook = 'updated during before delete'
    let afterDeleteDocument: Record<string, unknown> | undefined

    deletionSafetySpy.beforeTargetDelete = async ({ id, req }) => {
      await req.payload.db.updateOne({
        id,
        branch: false,
        collection: deletionSafetyTargetsSlug,
        data: { title: titleAfterHook },
        req,
      })
    }
    deletionSafetySpy.afterTargetDelete = ({ doc }) => {
      afterDeleteDocument = doc
    }

    const result = await payload.delete({
      branch: branch.slug,
      collection: deletionSafetyTargetsSlug,
      overrideAccess: true,
      select: { title: true },
      where: { id: { equals: target.id } },
    })

    expect(result.errors).toEqual([])
    expect(result.docs).toEqual([{ id: target.id, title: titleAfterHook }])
    expect(afterDeleteDocument).toEqual({ id: target.id, title: titleAfterHook })
  })

  test.options(
    'should roll back a shared-transaction branch tombstone when an after-delete hook fails',
    { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Shared delete rollback', payload })
      const target = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'shared rollback target' },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectTargetAfterDeleteID = target.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        const rejectedDelete = await payload.delete({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          where: { id: { equals: target.id } },
        })

        expect(rejectedDelete.docs).toHaveLength(0)
        expect(rejectedDelete.errors).toHaveLength(1)
        expect(rejectedDelete.errors[0]?.message).toContain('Rejected target after delete')

        await expectBranchDeleteToHaveRolledBack({
          id: target.id,
          branch: branch.slug,
          payload,
        })
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should roll back a per-document branch tombstone when an after-delete hook fails',
    { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Per-document delete rollback', payload })
      const target = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'per-document rollback target' },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectTargetAfterDeleteID = target.id
      payload.db.bulkOperationsSingleTransaction = true

      try {
        const result = await payload.delete({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          where: { id: { equals: target.id } },
        })

        expect(result.docs).toHaveLength(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.message).toBe('Rejected target after delete')
        await expectBranchDeleteToHaveRolledBack({
          id: target.id,
          branch: branch.slug,
          payload,
        })
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should reject an untouched bulk branch delete inside a caller transaction',
    { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Caller transaction bulk delete', payload })
      const target = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'caller transaction delete target' },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ branch: branch.slug, payload })
      const didStartTransaction = await initTransaction(req)

      expect(didStartTransaction).toBe(true)

      try {
        const result = await payload.delete({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          req,
          where: { id: { equals: target.id } },
        })

        expect(result.docs).toHaveLength(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.message).toBe(
          'Cannot delete an untouched branch document within an existing transaction.',
        )
        expect(req.transactionID).toBeTruthy()
        await expectBranchDeleteToHaveRolledBack({
          id: target.id,
          branch: branch.slug,
          payload,
        })
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should allow a selected existing branch shadow delete inside a caller transaction',
    { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Selected caller transaction delete', payload })
      const target = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'selected caller transaction main target' },
        overrideAccess: true,
      })

      await payload.update({
        id: target.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        data: { title: 'selected caller transaction branch target' },
        overrideAccess: true,
      })

      const req = await createPayloadRequest({ branch: branch.slug, payload })
      const didStartTransaction = await initTransaction(req)

      expect(didStartTransaction).toBe(true)

      try {
        const result = await payload.delete({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          req,
          select: { title: true },
          where: { id: { equals: target.id } },
        })

        expect(result.docs).toHaveLength(1)
        expect(result.errors).toEqual([])
        expect(req.transactionID).toBeTruthy()
      } finally {
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should not hard-delete main when a branch shadow disappears during delete',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Disappearing delete shadow', payload })
      const target = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'main target behind disappearing shadow' },
        overrideAccess: true,
      })

      await payload.update({
        id: target.id,
        branch: branch.slug,
        collection: deletionSafetyTargetsSlug,
        data: { title: 'branch target that will disappear' },
        overrideAccess: true,
      })

      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.beforeTargetDelete = async ({ id, req }) => {
        const shadow = await req.payload.db.findOne({
          branch: false,
          collection: deletionSafetyTargetsSlug,
          req,
          where: {
            and: [{ _branch: { equals: branch.slug } }, { _branchDocID: { equals: id } }],
          },
        })

        if (shadow) {
          await req.payload.db.deleteOne({
            branch: false,
            collection: deletionSafetyTargetsSlug,
            req,
            returning: false,
            where: { id: { equals: shadow.id } },
          })
        }
      }
      payload.db.bulkOperationsSingleTransaction = false

      try {
        const result = await payload.delete({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          where: { id: { equals: target.id } },
        })
        const mainAfterDelete = await payload.findByID({
          id: target.id,
          branch: false,
          collection: deletionSafetyTargetsSlug,
          disableErrors: true,
          overrideAccess: true,
        })
        const branchAfterDelete = await payload.findByID({
          id: target.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          disableErrors: true,
          overrideAccess: true,
        })

        expect(result.docs).toHaveLength(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.message).toContain('changed while it was being deleted')
        expect(mainAfterDelete?.id).toBe(target.id)
        expect(branchAfterDelete?.title).toBe('branch target that will disappear')
      } finally {
        deletionSafetySpy.beforeTargetDelete = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should clear rolled-back branch delete state before reusing the request',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Rolled-back delete request state', payload })
      const target = await payload.create({
        collection: deletionSafetyVersionedTargetsSlug,
        data: { title: 'versioned main target before rejected delete' },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ branch: branch.slug, payload })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectVersionedTargetAfterDeleteID = target.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        const rejectedDelete = await payload.delete({
          branch: branch.slug,
          collection: deletionSafetyVersionedTargetsSlug,
          overrideAccess: true,
          req,
          where: { id: { equals: target.id } },
        })

        expect(rejectedDelete.docs).toHaveLength(0)
        expect(rejectedDelete.errors).toHaveLength(1)
        expect(rejectedDelete.errors[0]?.message).toContain(
          'Rejected versioned target after delete',
        )

        deletionSafetySpy.rejectVersionedTargetAfterDeleteID = undefined

        const branchUpdate = await payload.update({
          id: target.id,
          branch: branch.slug,
          collection: deletionSafetyVersionedTargetsSlug,
          data: { title: 'branch update after rejected delete' },
          overrideAccess: true,
          req,
        })
        const mainAfterUpdate = await payload.findByID({
          id: target.id,
          branch: false,
          collection: deletionSafetyVersionedTargetsSlug,
          overrideAccess: true,
        })

        expect(branchUpdate.title).toBe('branch update after rejected delete')
        expect(mainAfterUpdate.title).toBe('versioned main target before rejected delete')
      } finally {
        deletionSafetySpy.rejectVersionedTargetAfterDeleteID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test('should leave a caller-owned transaction open when a merge delete hook fails', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Caller-owned upload delete', payload })
    const fileData = Buffer.from('caller-owned upload bytes')
    const upload = await payload.create({
      collection: deletionSafetyMediaSlug,
      data: { alt: 'caller-owned upload' },
      file: {
        name: 'caller-owned-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })

    await payload.delete({
      id: upload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
    })

    const req = await createPayloadRequest({ branch: false, payload })
    req.transactionID = 'caller-owned-transaction'
    const rollbackTransactionSpy = vi
      .spyOn(payload.db, 'rollbackTransaction')
      .mockResolvedValue(undefined)

    deletionSafetySpy.rejectUploadBeforeDelete = true

    try {
      await expect(
        payload.branches.merge({ branch: branch.slug, overrideAccess: true, req }),
      ).rejects.toThrow('Rejected upload deletion')

      expect(rollbackTransactionSpy).not.toHaveBeenCalled()
      expect(req.transactionID).toBeTruthy()
    } finally {
      deletionSafetySpy.rejectUploadBeforeDelete = false
      rollbackTransactionSpy.mockRestore()
      delete req.transactionID
    }
  })

  test('should leave a caller-owned transaction open when an individual bulk delete fails', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Caller-owned bulk delete', payload })
    const fileData = Buffer.from('caller-owned bulk upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'caller-owned bulk upload' },
      file: {
        name: 'caller-owned-bulk-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const req = await createPayloadRequest({ branch: branch.slug, payload })
    req.transactionID = 'caller-owned-transaction'
    const originalDeleteOne = payload.db.deleteOne.bind(payload.db)
    const deleteOneSpy = vi.spyOn(payload.db, 'deleteOne').mockImplementation(async (args) => {
      const id = (args.where as { id?: { equals?: unknown } }).id?.equals

      if (args.collection === deletionSafetyMediaSlug && String(id) === String(upload.id)) {
        throw new Error('Rejected individual bulk deletion')
      }

      return originalDeleteOne(args)
    })
    const rollbackTransactionSpy = vi
      .spyOn(payload.db, 'rollbackTransaction')
      .mockResolvedValue(undefined)
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction
    payload.db.bulkOperationsSingleTransaction = true

    try {
      await expect(
        payload.delete({
          branch: branch.slug,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
          req,
          where: { id: { equals: upload.id } },
        }),
      ).rejects.toThrow('Rejected individual bulk deletion')
      expect(rollbackTransactionSpy).not.toHaveBeenCalled()
      expect(req.transactionID).toBe('caller-owned-transaction')
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      deleteOneSpy.mockRestore()
      rollbackTransactionSpy.mockRestore()
      delete req.transactionID
    }
  })

  test('should keep the current file when a non-transactional upload update fails validation', async ({
    payload,
  }) => {
    const originalFileData = Buffer.from('original validation upload bytes')
    const upload = await payload.create({
      collection: deletionSafetyMediaSlug,
      data: { alt: 'original validation upload' },
      file: {
        name: 'original-validation-upload.txt',
        data: originalFileData,
        mimetype: 'text/plain',
        size: originalFileData.length,
      },
      overrideAccess: true,
    })
    const originalFilePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)
    const replacementFileData = Buffer.from('rejected replacement bytes')

    deletionSafetySpy.rejectUploadBeforeValidate = true

    await expect(
      payload.update({
        id: upload.id,
        collection: deletionSafetyMediaSlug,
        data: { alt: 'rejected replacement' },
        file: {
          name: 'rejected-validation-upload.txt',
          data: replacementFileData,
          mimetype: 'text/plain',
          size: replacementFileData.length,
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow('Rejected upload validation')

    expect(fs.existsSync(originalFilePath)).toBe(true)
  })

  test.options(
    'should restore an overwritten branch bulk upload when its document transaction rolls back',
    { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Branch upload file rollback', payload })
      const originalFileData = Buffer.from('branch bulk rollback original bytes')
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'branch bulk rollback original' },
        file: {
          name: 'branch-bulk-rollback.txt',
          data: originalFileData,
          mimetype: 'text/plain',
          size: originalFileData.length,
        },
        overrideAccess: true,
      })
      const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)
      const replacementFileData = Buffer.from('branch bulk rollback replacement bytes')

      deletionSafetySpy.rejectUploadAfterChange = true

      const result = await payload.update({
        branch: branch.slug,
        collection: deletionSafetyMediaSlug,
        data: { alt: 'branch bulk rollback replacement' },
        file: {
          name: upload.filename,
          data: replacementFileData,
          mimetype: 'text/plain',
          size: replacementFileData.length,
        },
        overrideAccess: true,
        overwriteExistingFiles: true,
        where: { id: { equals: upload.id } },
      })
      const uploadAfterRollback = await payload.findByID({
        id: upload.id,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      })
      const branchUploadAfterRollback = await payload.findByID({
        id: upload.id,
        branch: branch.slug,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      })

      expect(result.docs).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]?.message).toBe('Rejected upload after change')
      expect(uploadAfterRollback.alt).toBe('branch bulk rollback original')
      expect(branchUploadAfterRollback.alt).toBe('branch bulk rollback original')
      expect(fs.readFileSync(filePath)).toEqual(originalFileData)
    },
  )

  test.options(
    'should restore an overwritten bulk upload after a per-document transaction rollback',
    { db: (adapter) => databaseAdapterSupportsTransactions({ adapter }) },
    async ({ payload }) => {
      const originalFileData = Buffer.from('per-document rollback original bytes')
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'per-document rollback original' },
        file: {
          name: 'per-document-bulk-rollback.txt',
          data: originalFileData,
          mimetype: 'text/plain',
          size: originalFileData.length,
        },
        overrideAccess: true,
      })
      const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)
      const replacementFileData = Buffer.from('per-document rollback replacement bytes')
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectUploadAfterChangeID = upload.id
      payload.db.bulkOperationsSingleTransaction = true

      try {
        const result = await payload.update({
          collection: deletionSafetyMediaSlug,
          data: { alt: 'per-document rollback replacement' },
          file: {
            name: upload.filename,
            data: replacementFileData,
            mimetype: 'text/plain',
            size: replacementFileData.length,
          },
          overrideAccess: true,
          overwriteExistingFiles: true,
          where: { id: { equals: upload.id } },
        })
        const uploadAfterRollback = await payload.findByID({
          id: upload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(result.docs).toHaveLength(0)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.message).toBe('Rejected upload after change')
        expect(uploadAfterRollback.alt).toBe('per-document rollback original')
        expect(fs.readFileSync(filePath)).toEqual(originalFileData)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should report a bulk upload cleanup failure after a non-transactional write',
    { db: (adapter) => adapter.startsWith('sqlite') },
    async ({ payload }) => {
      const originalFileData = Buffer.from('cleanup failure original bytes')
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'cleanup failure original' },
        file: {
          name: 'cleanup-failure-original.txt',
          data: originalFileData,
          mimetype: 'text/plain',
          size: originalFileData.length,
        },
        overrideAccess: true,
      })
      const replacementFileData = Buffer.from('cleanup failure replacement bytes')
      const cleanupError = new Error('Unable to remove the original upload')
      const removeSpy = vi.spyOn(fs.promises, 'rm').mockRejectedValueOnce(cleanupError)
      const loggerErrorSpy = vi.spyOn(payload.logger, 'error').mockImplementation(() => undefined)

      try {
        const result = await payload.update({
          collection: deletionSafetyMediaSlug,
          data: { alt: 'cleanup failure replacement' },
          file: {
            name: 'cleanup-failure-replacement.txt',
            data: replacementFileData,
            mimetype: 'text/plain',
            size: replacementFileData.length,
          },
          overrideAccess: true,
          where: { id: { equals: upload.id } },
        })

        expect(result.docs).toHaveLength(1)
        expect(result.errors).toEqual([])
        expect(loggerErrorSpy).toHaveBeenCalledWith({
          err: expect.any(Error),
          msg: 'A post-commit cleanup task failed.',
        })
      } finally {
        removeSpy.mockRestore()
        loggerErrorSpy.mockRestore()
      }
    },
  )

  test.options(
    'should remove a successful non-transactional bulk upload replacement while keeping a failed document file',
    { db: (adapter) => adapter.startsWith('sqlite') },
    async ({ payload }) => {
      const successfulFileData = Buffer.from('successful bulk update original bytes')
      const successfulUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'a successful bulk update upload' },
        file: {
          name: 'successful-bulk-update-original.txt',
          data: successfulFileData,
          mimetype: 'text/plain',
          size: successfulFileData.length,
        },
        overrideAccess: true,
      })
      const failedFileData = Buffer.from('failed bulk update original bytes')
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'b failed bulk update upload' },
        file: {
          name: 'failed-bulk-update-original.txt',
          data: failedFileData,
          mimetype: 'text/plain',
          size: failedFileData.length,
        },
        overrideAccess: true,
      })
      const successfulFilePath = path.resolve(
        deletionSafetyMediaDirectory,
        successfulUpload.filename,
      )
      const failedFilePath = path.resolve(deletionSafetyMediaDirectory, failedUpload.filename)
      const replacementFileData = Buffer.from('mixed bulk update replacement bytes')

      deletionSafetySpy.rejectUploadBeforeValidateID = failedUpload.id

      const result = await payload.update({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'mixed bulk update replacement' },
        file: {
          name: 'mixed-bulk-update-replacement.txt',
          data: replacementFileData,
          mimetype: 'text/plain',
          size: replacementFileData.length,
        },
        overrideAccess: true,
        sort: 'alt',
        where: { id: { in: [successfulUpload.id, failedUpload.id] } },
      })
      const successfulAfterUpdate = await payload.findByID({
        id: successfulUpload.id,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      })
      const replacementFilePath = path.resolve(
        deletionSafetyMediaDirectory,
        successfulAfterUpdate.filename,
      )

      expect(result.docs).toHaveLength(1)
      expect(result.errors).toHaveLength(1)
      expect(String(result.errors[0]?.id)).toBe(String(failedUpload.id))
      expect(successfulAfterUpdate.alt).toBe('mixed bulk update replacement')
      expect(fs.existsSync(successfulFilePath)).toBe(false)
      expect(fs.existsSync(failedFilePath)).toBe(true)
      expect(fs.existsSync(replacementFilePath)).toBe(true)
      expect(fs.readFileSync(replacementFilePath)).toEqual(replacementFileData)
    },
  )

  test.options(
    'should roll back an operation-owned bulk upload when one document fails validation',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const successfulFileData = Buffer.from('operation transaction successful original bytes')
      const successfulUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'a operation transaction successful upload' },
        file: {
          name: 'operation-transaction-successful-original.txt',
          data: successfulFileData,
          mimetype: 'text/plain',
          size: successfulFileData.length,
        },
        overrideAccess: true,
      })
      const failedFileData = Buffer.from('operation transaction failed original bytes')
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'b operation transaction failed upload' },
        file: {
          name: 'operation-transaction-failed-original.txt',
          data: failedFileData,
          mimetype: 'text/plain',
          size: failedFileData.length,
        },
        overrideAccess: true,
      })
      const successfulFilePath = path.resolve(
        deletionSafetyMediaDirectory,
        successfulUpload.filename,
      )
      const failedFilePath = path.resolve(deletionSafetyMediaDirectory, failedUpload.filename)
      const replacementFileData = Buffer.from('operation transaction replacement bytes')
      const replacementFilePath = path.resolve(
        deletionSafetyMediaDirectory,
        'operation-transaction-replacement.txt',
      )
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectUploadBeforeValidateID = failedUpload.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'operation transaction replacement' },
            file: {
              name: 'operation-transaction-replacement.txt',
              data: replacementFileData,
              mimetype: 'text/plain',
              size: replacementFileData.length,
            },
            overrideAccess: true,
            sort: 'alt',
            where: { id: { in: [successfulUpload.id, failedUpload.id] } },
          }),
        ).rejects.toThrow('Rejected upload validation')

        const successfulAfterRollback = await payload.findByID({
          id: successfulUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const failedAfterRollback = await payload.findByID({
          id: failedUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(successfulAfterRollback.alt).toBe('a operation transaction successful upload')
        expect(failedAfterRollback.alt).toBe('b operation transaction failed upload')
        expect(fs.existsSync(successfulFilePath)).toBe(true)
        expect(fs.existsSync(failedFilePath)).toBe(true)
        expect(fs.existsSync(replacementFilePath)).toBe(false)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should restore an overwritten upload when an operation-owned transaction rolls back',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const originalFileData = Buffer.from('same path original bytes')
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'same path original' },
        file: {
          name: 'same-path-operation-rollback.txt',
          data: originalFileData,
          mimetype: 'text/plain',
          size: originalFileData.length,
        },
        overrideAccess: true,
      })
      const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)
      const replacementFileData = Buffer.from('same path replacement bytes')
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectUploadAfterChangeID = upload.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'same path replacement' },
            file: {
              name: upload.filename,
              data: replacementFileData,
              mimetype: 'text/plain',
              size: replacementFileData.length,
            },
            overrideAccess: true,
            overwriteExistingFiles: true,
            where: { id: { equals: upload.id } },
          }),
        ).rejects.toThrow('Rejected upload after change')

        const uploadAfterRollback = await payload.findByID({
          id: upload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(uploadAfterRollback.alt).toBe('same path original')
        expect(fs.readFileSync(filePath)).toEqual(originalFileData)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should keep a concurrent upload replacement when an operation-owned transaction rolls back',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const originalFileData = Buffer.from('concurrent rollback original bytes')
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'concurrent rollback original' },
        file: {
          name: 'concurrent-rollback-original.txt',
          data: originalFileData,
          mimetype: 'text/plain',
          size: originalFileData.length,
        },
        overrideAccess: true,
      })
      const originalFilePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)
      const replacementFileData = Buffer.from('operation-owned replacement bytes')
      const replacementFilePath = path.resolve(
        deletionSafetyMediaDirectory,
        'concurrent-rollback-replacement.txt',
      )
      const concurrentFileData = Buffer.from('concurrent replacement bytes that must remain')
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectUploadAfterChangeID = upload.id
      deletionSafetySpy.beforeRejectedUploadAfterChange = () =>
        fs.promises.writeFile(replacementFilePath, concurrentFileData)
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'operation-owned replacement' },
            file: {
              name: 'concurrent-rollback-replacement.txt',
              data: replacementFileData,
              mimetype: 'text/plain',
              size: replacementFileData.length,
            },
            overrideAccess: true,
            where: { id: { equals: upload.id } },
          }),
        ).rejects.toThrow('Rejected upload after change')

        const uploadAfterRollback = await payload.findByID({
          id: upload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(uploadAfterRollback.alt).toBe('concurrent rollback original')
        expect(fs.readFileSync(originalFilePath)).toEqual(originalFileData)
        expect(fs.readFileSync(replacementFilePath)).toEqual(concurrentFileData)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test('should reprocess each existing bulk upload from its own file', async ({ payload }) => {
    const firstImageData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.png'))
    const secondImageData = fs.readFileSync(path.resolve(process.cwd(), 'test/uploads/image.jpg'))
    const firstUpload = await payload.create({
      collection: deletionSafetyMediaSlug,
      data: { alt: 'a first reprocessed upload' },
      file: {
        name: 'first-reprocessed-upload.png',
        data: firstImageData,
        mimetype: 'image/png',
        size: firstImageData.length,
      },
      overrideAccess: true,
    })
    const secondUpload = await payload.create({
      collection: deletionSafetyMediaSlug,
      data: { alt: 'b second reprocessed upload' },
      file: {
        name: 'second-reprocessed-upload.jpg',
        data: secondImageData,
        mimetype: 'image/jpeg',
        size: secondImageData.length,
      },
      overrideAccess: true,
    })

    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction
    const req = await createPayloadRequest({ payload })

    payload.db.bulkOperationsSingleTransaction = true
    req.query.uploadEdits = { focalPoint: { x: 25, y: 25 } }

    try {
      const result = await payload.update({
        collection: deletionSafetyMediaSlug,
        data: {},
        overrideAccess: true,
        req,
        sort: 'alt',
        where: { id: { in: [firstUpload.id, secondUpload.id] } },
      })
      const firstAfterUpdate = await payload.findByID({
        id: firstUpload.id,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      })
      const secondAfterUpdate = await payload.findByID({
        id: secondUpload.id,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      })

      expect(result.errors).toEqual([])
      expect(result.docs).toHaveLength(2)
      expect(firstAfterUpdate.filename).toBe(firstUpload.filename)
      expect(secondAfterUpdate.filename).toBe(secondUpload.filename)
      expect(firstAfterUpdate.mimeType).toBe(firstUpload.mimeType)
      expect(secondAfterUpdate.mimeType).toBe(secondUpload.mimeType)
      expect(deletionSafetySpy.uploadUpdateRequestFiles).toEqual([
        { id: firstUpload.id, name: firstUpload.filename },
        { id: secondUpload.id, name: secondUpload.filename },
      ])
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }
  })

  test.options(
    'should roll back only the document that fails after a single-transaction adapter write',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const successfulFileData = Buffer.from('late failure successful original bytes')
      const successfulUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'late failure successful original' },
        file: {
          name: 'late-failure-successful-original.txt',
          data: successfulFileData,
          mimetype: 'text/plain',
          size: successfulFileData.length,
        },
        overrideAccess: true,
      })
      const failedFileData = Buffer.from('late failure rejected original bytes')
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'late failure rejected original' },
        file: {
          name: 'late-failure-rejected-original.txt',
          data: failedFileData,
          mimetype: 'text/plain',
          size: failedFileData.length,
        },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectUploadAfterChangeID = failedUpload.id
      payload.db.bulkOperationsSingleTransaction = true

      try {
        const result = await payload.update({
          collection: deletionSafetyMediaSlug,
          data: { alt: 'late failure replacement' },
          overrideAccess: true,
          where: { id: { in: [successfulUpload.id, failedUpload.id] } },
        })
        const successfulUploadAfterUpdate = await payload.findByID({
          id: successfulUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const failedUploadAfterUpdate = await payload.findByID({
          id: failedUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(result.docs).toHaveLength(1)
        expect(result.errors).toHaveLength(1)
        expect(String(result.errors[0]?.id)).toBe(String(failedUpload.id))
        expect(successfulUploadAfterUpdate.alt).toBe('late failure replacement')
        expect(failedUploadAfterUpdate.alt).toBe('late failure rejected original')
      } finally {
        deletionSafetySpy.rejectUploadAfterChangeID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should keep successful first branch bulk updates and roll back the failed document fork',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const branch = await createBranch({ name: 'Mixed first branch bulk update', payload })
      const successfulTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'a successful main target' },
        overrideAccess: true,
      })
      const failedTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'b failed main target' },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectTargetAfterChangeID = failedTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        const result = await payload.update({
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          data: { title: 'branch bulk replacement' },
          overrideAccess: true,
          sort: 'title',
          where: { id: { in: [successfulTarget.id, failedTarget.id] } },
        })
        const successfulMainAfterUpdate = await payload.findByID({
          id: successfulTarget.id,
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const failedMainAfterUpdate = await payload.findByID({
          id: failedTarget.id,
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const successfulBranchAfterUpdate = await payload.findByID({
          id: successfulTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const failedBranchAfterUpdate = await payload.findByID({
          id: failedTarget.id,
          branch: branch.slug,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const successfulShadows = await payload.find({
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [
              { _branch: { equals: branch.slug } },
              { _branchDocID: { equals: successfulTarget.id } },
            ],
          },
        })
        const failedShadows = await payload.find({
          branch: false,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          pagination: false,
          showHiddenFields: true,
          where: {
            and: [
              { _branch: { equals: branch.slug } },
              { _branchDocID: { equals: failedTarget.id } },
            ],
          },
        })
        const successfulChanges = await payload.find({
          collection: branchChangesSlug,
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              { branch: { equals: branch.slug } },
              { 'doc.value': { equals: successfulTarget.id } },
            ],
          },
        })
        const failedChanges = await payload.find({
          collection: branchChangesSlug,
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              { branch: { equals: branch.slug } },
              { 'doc.value': { equals: failedTarget.id } },
            ],
          },
        })

        expect(result.docs).toHaveLength(1)
        expect(result.errors).toHaveLength(1)
        expect(String(result.errors[0]?.id)).toBe(String(failedTarget.id))
        expect(successfulMainAfterUpdate.title).toBe('a successful main target')
        expect(failedMainAfterUpdate.title).toBe('b failed main target')
        expect(successfulBranchAfterUpdate.title).toBe('branch bulk replacement')
        expect(failedBranchAfterUpdate.title).toBe('b failed main target')
        expect(successfulShadows.docs).toHaveLength(1)
        expect(failedShadows.docs).toHaveLength(0)
        expect(successfulChanges.docs).toHaveLength(1)
        expect(failedChanges.docs).toHaveLength(0)
      } finally {
        deletionSafetySpy.rejectTargetAfterChangeID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should clear bulk upload cleanup when a caller-owned transaction is rolled back',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const successfulFileData = Buffer.from('caller transaction successful original bytes')
      const successfulUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'caller transaction successful upload' },
        file: {
          name: 'caller-transaction-successful-original.txt',
          data: successfulFileData,
          mimetype: 'text/plain',
          size: successfulFileData.length,
        },
        overrideAccess: true,
      })
      const failedFileData = Buffer.from('caller transaction failed original bytes')
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'caller transaction failed upload' },
        file: {
          name: 'caller-transaction-failed-original.txt',
          data: failedFileData,
          mimetype: 'text/plain',
          size: failedFileData.length,
        },
        overrideAccess: true,
      })
      const successfulFilePath = path.resolve(
        deletionSafetyMediaDirectory,
        successfulUpload.filename,
      )
      const failedFilePath = path.resolve(deletionSafetyMediaDirectory, failedUpload.filename)
      const replacementFileData = Buffer.from('caller transaction mixed replacement bytes')
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      expect(didStartTransaction).toBe(true)
      deletionSafetySpy.rejectUploadBeforeValidateID = failedUpload.id
      payload.db.bulkOperationsSingleTransaction = true

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'caller transaction mixed replacement' },
            file: {
              name: 'caller-transaction-mixed-replacement.txt',
              data: replacementFileData,
              mimetype: 'text/plain',
              size: replacementFileData.length,
            },
            overrideAccess: true,
            req,
            sort: 'alt',
            where: { id: { in: [successfulUpload.id, failedUpload.id] } },
          }),
        ).rejects.toThrow('Rejected upload validation')

        expect(req.transactionID).toBe(callerTransactionID)
        expect(fs.existsSync(successfulFilePath)).toBe(true)
        expect(fs.existsSync(failedFilePath)).toBe(true)

        await killTransaction(req)

        const successfulAfterRollback = await payload.findByID({
          id: successfulUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const failedAfterRollback = await payload.findByID({
          id: failedUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(successfulAfterRollback.alt).toBe('caller transaction successful upload')
        expect(failedAfterRollback.alt).toBe('caller transaction failed upload')
        expect(fs.existsSync(successfulFilePath)).toBe(true)
        expect(fs.existsSync(failedFilePath)).toBe(true)
      } finally {
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should reject a caller-owned bulk update when a document fails after writing',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const successfulFileData = Buffer.from('caller late successful bytes')
      const successfulUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'a caller transaction successful upload' },
        file: {
          name: 'caller-late-successful.txt',
          data: successfulFileData,
          mimetype: 'text/plain',
          size: successfulFileData.length,
        },
        overrideAccess: true,
      })
      const failedFileData = Buffer.from('caller late failed bytes')
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'b caller transaction failed upload' },
        file: {
          name: 'caller-late-failed.txt',
          data: failedFileData,
          mimetype: 'text/plain',
          size: failedFileData.length,
        },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      expect(didStartTransaction).toBe(true)
      deletionSafetySpy.rejectUploadAfterChangeID = failedUpload.id
      payload.db.bulkOperationsSingleTransaction = true

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'caller transaction replacement' },
            overrideAccess: true,
            req,
            sort: 'alt',
            where: { id: { in: [successfulUpload.id, failedUpload.id] } },
          }),
        ).rejects.toThrow('Rejected upload after change')

        expect(req.transactionID).toBe(callerTransactionID)

        await killTransaction(req)

        const successfulAfterRollback = await payload.findByID({
          id: successfulUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const failedAfterRollback = await payload.findByID({
          id: failedUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })

        expect(successfulAfterRollback.alt).toBe('a caller transaction successful upload')
        expect(failedAfterRollback.alt).toBe('b caller transaction failed upload')
      } finally {
        deletionSafetySpy.rejectUploadAfterChangeID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should roll back an operation-owned bulk transaction when a document fails after writing',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const successfulTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'a successful operation-owned target' },
        overrideAccess: true,
      })
      const failedTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'b failed operation-owned target' },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectTargetAfterChangeID = failedTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyTargetsSlug,
            data: { title: 'operation-owned replacement' },
            overrideAccess: true,
            sort: 'title',
            where: { id: { in: [successfulTarget.id, failedTarget.id] } },
          }),
        ).rejects.toThrow('Rejected target after change')

        const successfulAfterRollback = await payload.findByID({
          id: successfulTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })
        const failedAfterRollback = await payload.findByID({
          id: failedTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(successfulAfterRollback.title).toBe('a successful operation-owned target')
        expect(failedAfterRollback.title).toBe('b failed operation-owned target')
      } finally {
        deletionSafetySpy.rejectTargetAfterChangeID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should reject a caller-owned bulk update when a hook writes and then fails',
    { db: (adapter) => transactionCapableMongooseAdapters.has(adapter) },
    async ({ payload }) => {
      const hookWriteTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'hook write target original' },
        overrideAccess: true,
      })
      const failedFileData = Buffer.from('caller hook failed bytes')
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'a hook write failure upload' },
        file: {
          name: 'caller-hook-failed.txt',
          data: failedFileData,
          mimetype: 'text/plain',
          size: failedFileData.length,
        },
        overrideAccess: true,
      })
      const laterFileData = Buffer.from('caller hook later bytes')
      const laterUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'b later caller upload' },
        file: {
          name: 'caller-hook-later.txt',
          data: laterFileData,
          mimetype: 'text/plain',
          size: laterFileData.length,
        },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ payload })
      const didStartTransaction = await initTransaction(req)
      const callerTransactionID = await req.transactionID
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      expect(didStartTransaction).toBe(true)
      deletionSafetySpy.rejectUploadAfterHookWriteID = failedUpload.id
      deletionSafetySpy.uploadHookWriteTargetID = hookWriteTarget.id
      payload.db.bulkOperationsSingleTransaction = true

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'caller hook replacement' },
            overrideAccess: true,
            req,
            sort: 'alt',
            where: { id: { in: [failedUpload.id, laterUpload.id] } },
          }),
        ).rejects.toThrow('Rejected upload after hook write')

        expect(req.transactionID).toBe(callerTransactionID)

        const targetInsideTransaction = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
          req,
        })
        const laterInsideTransaction = await payload.findByID({
          id: laterUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
          req,
        })

        expect(targetInsideTransaction.title).toBe('written by rejected upload hook')
        expect(laterInsideTransaction.alt).toBe('b later caller upload')

        await killTransaction(req)

        const targetAfterRollback = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(targetAfterRollback.title).toBe('hook write target original')
      } finally {
        deletionSafetySpy.rejectUploadAfterHookWriteID = undefined
        deletionSafetySpy.uploadHookWriteTargetID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
        if (req.transactionID) {
          await killTransaction(req)
        }
      }
    },
  )

  test.options(
    'should roll back an operation-owned bulk update when a pre-write hook writes and then fails',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const hookWriteTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'operation hook write target original' },
        overrideAccess: true,
      })
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'operation hook write failure upload' },
        file: {
          name: 'operation-hook-failed.txt',
          data: Buffer.from('operation hook failed bytes'),
          mimetype: 'text/plain',
          size: 27,
        },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.rejectUploadAfterHookWriteID = failedUpload.id
      deletionSafetySpy.uploadHookWriteTargetID = hookWriteTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'rejected operation hook replacement' },
            overrideAccess: true,
            where: { id: { equals: failedUpload.id } },
          }),
        ).rejects.toThrow('Rejected upload after hook write')

        const targetAfterRollback = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(targetAfterRollback.title).toBe('operation hook write target original')
      } finally {
        deletionSafetySpy.rejectUploadAfterHookWriteID = undefined
        deletionSafetySpy.uploadHookWriteTargetID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should keep an earlier successful document when a later pre-write validation fails',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const hookWriteTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'per-document hook target original' },
        overrideAccess: true,
      })
      const successfulUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'a successful upload' },
        file: {
          name: 'per-document-success.txt',
          data: Buffer.from('per-document success'),
          mimetype: 'text/plain',
          size: 20,
        },
        overrideAccess: true,
      })
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'b failed upload' },
        file: {
          name: 'per-document-failure.txt',
          data: Buffer.from('per-document failure'),
          mimetype: 'text/plain',
          size: 20,
        },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.uploadHookWriteID = successfulUpload.id
      deletionSafetySpy.uploadHookWriteTargetID = hookWriteTarget.id
      deletionSafetySpy.rejectUploadBeforeValidateID = failedUpload.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        const result = await payload.update({
          collection: deletionSafetyMediaSlug,
          data: { alt: 'bulk replacement' },
          overrideAccess: true,
          sort: 'alt',
          where: { id: { in: [successfulUpload.id, failedUpload.id] } },
        })

        expect(result.docs).toHaveLength(1)
        expect(result.docs[0]?.id).toBe(successfulUpload.id)
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.id).toBe(failedUpload.id)

        const successfulAfterUpdate = await payload.findByID({
          id: successfulUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const failedAfterUpdate = await payload.findByID({
          id: failedUpload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const targetAfterUpdate = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(successfulAfterUpdate.alt).toBe('bulk replacement')
        expect(failedAfterUpdate.alt).toBe('b failed upload')
        expect(targetAfterUpdate.title).toBe('written by rejected upload hook')
      } finally {
        deletionSafetySpy.uploadHookWriteID = undefined
        deletionSafetySpy.uploadHookWriteTargetID = undefined
        deletionSafetySpy.rejectUploadBeforeValidateID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should roll back a disabled-transaction hook write when its parent document fails',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const hookWriteTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'disabled transaction hook target original' },
        overrideAccess: true,
      })
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'disabled transaction hook failure upload' },
        file: {
          name: 'disabled-transaction-hook-failure.txt',
          data: Buffer.from('disabled transaction hook failure'),
          mimetype: 'text/plain',
          size: 33,
        },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.disableUploadHookWriteTransaction = true
      deletionSafetySpy.rejectUploadAfterHookWriteID = failedUpload.id
      deletionSafetySpy.uploadHookWriteTargetID = hookWriteTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'rejected disabled transaction hook replacement' },
            overrideAccess: true,
            where: { id: { equals: failedUpload.id } },
          }),
        ).rejects.toThrow('Rejected upload after hook write')

        const targetAfterRollback = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(targetAfterRollback.title).toBe('disabled transaction hook target original')
      } finally {
        deletionSafetySpy.disableUploadHookWriteTransaction = false
        deletionSafetySpy.rejectUploadAfterHookWriteID = undefined
        deletionSafetySpy.uploadHookWriteTargetID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should roll back a direct database hook write when its parent document fails',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const hookWriteTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'direct database hook target original' },
        overrideAccess: true,
      })
      const failedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'direct database hook failure upload' },
        file: {
          name: 'direct-database-hook-failure.txt',
          data: Buffer.from('direct database hook failure'),
          mimetype: 'text/plain',
          size: 28,
        },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.directDatabaseUploadHookWrite = true
      deletionSafetySpy.rejectUploadAfterHookWriteID = failedUpload.id
      deletionSafetySpy.uploadHookWriteTargetID = hookWriteTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyMediaSlug,
            data: { alt: 'rejected direct database hook replacement' },
            overrideAccess: true,
            where: { id: { equals: failedUpload.id } },
          }),
        ).rejects.toThrow('Rejected upload after hook write')

        const targetAfterRollback = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(targetAfterRollback.title).toBe('direct database hook target original')
      } finally {
        deletionSafetySpy.directDatabaseUploadHookWrite = false
        deletionSafetySpy.rejectUploadAfterHookWriteID = undefined
        deletionSafetySpy.uploadHookWriteTargetID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should detect a direct database write before a non-upload validation failure',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const hookWriteTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'direct target hook write original' },
        overrideAccess: true,
      })
      const failedTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'direct target hook failure' },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.directDatabaseWriteFailureID = failedTarget.id
      deletionSafetySpy.directDatabaseWriteTargetID = hookWriteTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyTargetsSlug,
            data: { title: 'rejected direct target replacement' },
            overrideAccess: true,
            where: { id: { equals: failedTarget.id } },
          }),
        ).rejects.toThrow('Rejected target after direct database write')

        const targetAfterRollback = await payload.findByID({
          id: hookWriteTarget.id,
          collection: deletionSafetyTargetsSlug,
          overrideAccess: true,
        })

        expect(targetAfterRollback.title).toBe('direct target hook write original')
      } finally {
        deletionSafetySpy.directDatabaseWriteFailureID = undefined
        deletionSafetySpy.directDatabaseWriteTargetID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should roll back a queued job when its parent document fails validation',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const failedTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'queued job target failure' },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.queueJobBeforeTargetValidationFailureID = failedTarget.id
      payload.db.bulkOperationsSingleTransaction = false

      try {
        await expect(
          payload.update({
            collection: deletionSafetyTargetsSlug,
            data: { title: 'rejected queued job target replacement' },
            overrideAccess: true,
            where: { id: { equals: failedTarget.id } },
          }),
        ).rejects.toThrow('Rejected target after queueing a job')

        const queuedJobs = await payload.find({
          collection: 'payload-jobs',
          overrideAccess: true,
          pagination: false,
          where: { 'input.doc.value': { equals: failedTarget.id } },
        })

        expect(queuedJobs.docs).toHaveLength(0)
      } finally {
        deletionSafetySpy.queueJobBeforeTargetValidationFailureID = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test.options(
    'should reject an update when its existing lock is reassigned during validation',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const originalLockUser = await payload.create({
        collection: 'users',
        data: { email: 'original-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const newLockUser = await payload.create({
        collection: 'users',
        data: { email: 'new-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'lock race original' },
        file: {
          name: 'lock-race.txt',
          data: Buffer.from('lock race'),
          mimetype: 'text/plain',
          size: 9,
        },
        overrideAccess: true,
      })
      const lock = await payload.create({
        collection: 'payload-locked-documents',
        data: {
          document: { relationTo: deletionSafetyMediaSlug, value: upload.id },
          user: { relationTo: 'users', value: originalLockUser.id },
        },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ payload })

      req.user = { ...originalLockUser, collection: 'users' }
      deletionSafetySpy.reassignUploadLockDuringValidation = {
        lockID: lock.id,
        userID: newLockUser.id,
      }

      try {
        await expect(
          payload.update({
            id: upload.id,
            collection: deletionSafetyMediaSlug,
            data: { alt: 'lock race updated' },
            overrideAccess: true,
            overrideLock: false,
            req,
          }),
        ).rejects.toThrow('currently locked by another user')

        const locks = await payload.find({
          collection: 'payload-locked-documents',
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              { 'document.relationTo': { equals: deletionSafetyMediaSlug } },
              { 'document.value': { equals: upload.id } },
            ],
          },
        })

        expect(locks.docs).toHaveLength(1)
        expect(getRelationshipID(locks.docs[0]?.user?.value)).toBe(newLockUser.id)
      } finally {
        deletionSafetySpy.reassignUploadLockDuringValidation = undefined
      }
    },
  )

  test.options(
    'should reject an update when its existing lock is reassigned within its transaction',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const originalLockUser = await payload.create({
        collection: 'users',
        data: { email: 'transaction-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const newLockUser = await payload.create({
        collection: 'users',
        data: { email: 'transaction-new-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const upload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'transaction lock race original' },
        file: {
          name: 'transaction-lock-race.txt',
          data: Buffer.from('transaction lock race'),
          mimetype: 'text/plain',
          size: 21,
        },
        overrideAccess: true,
      })
      const lock = await payload.create({
        collection: 'payload-locked-documents',
        data: {
          document: { relationTo: deletionSafetyMediaSlug, value: upload.id },
          user: { relationTo: 'users', value: originalLockUser.id },
        },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ payload })

      req.user = { ...originalLockUser, collection: 'users' }
      deletionSafetySpy.reassignUploadLockDuringValidation = {
        lockID: lock.id,
        useCurrentRequest: true,
        userID: newLockUser.id,
      }

      try {
        await expect(
          payload.update({
            id: upload.id,
            collection: deletionSafetyMediaSlug,
            data: { alt: 'transaction lock race updated' },
            overrideAccess: true,
            overrideLock: false,
            req,
          }),
        ).rejects.toThrow('currently locked by another user')

        const uploadAfterRejection = await payload.findByID({
          id: upload.id,
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
        })
        const locks = await payload.find({
          collection: 'payload-locked-documents',
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              { 'document.relationTo': { equals: deletionSafetyMediaSlug } },
              { 'document.value': { equals: upload.id } },
            ],
          },
        })

        expect(uploadAfterRejection.alt).toBe('transaction lock race original')
        expect(locks.docs).toHaveLength(1)
        expect(getRelationshipID(locks.docs[0]?.user?.value)).toBe(originalLockUser.id)
      } finally {
        deletionSafetySpy.reassignUploadLockDuringValidation = undefined
      }
    },
  )

  test.options(
    'should reject a global update when its lock is reassigned during validation',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const originalLockUser = await payload.create({
        collection: 'users',
        data: { email: 'global-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const newLockUser = await payload.create({
        collection: 'users',
        data: { email: 'global-new-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const originalTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'global lock original target' },
        overrideAccess: true,
      })
      const replacementTarget = await payload.create({
        collection: deletionSafetyTargetsSlug,
        data: { title: 'global lock replacement target' },
        overrideAccess: true,
      })

      await payload.updateGlobal({
        slug: deletionSafetyGlobalSlug,
        data: { target: originalTarget.id },
        overrideAccess: true,
      })

      const lock = await payload.create({
        collection: 'payload-locked-documents',
        data: {
          globalSlug: deletionSafetyGlobalSlug,
          user: { relationTo: 'users', value: originalLockUser.id },
        },
        overrideAccess: true,
      })
      const req = await createPayloadRequest({ payload })

      req.user = { ...originalLockUser, collection: 'users' }
      deletionSafetySpy.reassignGlobalLockDuringValidation = {
        lockID: lock.id,
        useCurrentRequest: true,
        userID: newLockUser.id,
      }

      try {
        await expect(
          payload.updateGlobal({
            slug: deletionSafetyGlobalSlug,
            data: { target: replacementTarget.id },
            overrideAccess: true,
            overrideLock: false,
            req,
          }),
        ).rejects.toThrow('currently locked by another user')

        const globalAfterRejection = await payload.db.findGlobal<{ target?: unknown }>({
          slug: deletionSafetyGlobalSlug,
        })
        const locks = await payload.find({
          collection: 'payload-locked-documents',
          overrideAccess: true,
          pagination: false,
          where: { globalSlug: { equals: deletionSafetyGlobalSlug } },
        })

        expect(getRelationshipID(globalAfterRejection.target)).toBe(originalTarget.id)
        expect(locks.docs).toHaveLength(1)
        expect(getRelationshipID(locks.docs[0]?.user?.value)).toBe(originalLockUser.id)
      } finally {
        deletionSafetySpy.reassignGlobalLockDuringValidation = undefined
      }
    },
  )

  test.options(
    'should refresh locks created or reassigned during bulk delete hooks',
    { db: (adapter) => isPostgresDatabaseAdapter({ adapter }) },
    async ({ payload }) => {
      const deletingUser = await payload.create({
        collection: 'users',
        data: { email: 'bulk-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const newLockUser = await payload.create({
        collection: 'users',
        data: { email: 'bulk-new-lock-user@example.com', password: 'test' },
        overrideAccess: true,
      })
      const protectedUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'bulk lock protected upload' },
        file: {
          name: 'bulk-lock-protected.txt',
          data: Buffer.from('bulk lock protected'),
          mimetype: 'text/plain',
          size: 19,
        },
        overrideAccess: true,
      })
      const deletableUpload = await payload.create({
        collection: deletionSafetyMediaSlug,
        data: { alt: 'bulk lock deletable upload' },
        file: {
          name: 'bulk-lock-deletable.txt',
          data: Buffer.from('bulk lock deletable'),
          mimetype: 'text/plain',
          size: 19,
        },
        overrideAccess: true,
      })
      const originalLock = await payload.create({
        collection: 'payload-locked-documents',
        data: {
          document: { relationTo: deletionSafetyMediaSlug, value: protectedUpload.id },
          user: { relationTo: 'users', value: deletingUser.id },
        },
        overrideAccess: true,
      })
      const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

      deletionSafetySpy.beforeUploadDelete = async ({ id, req }) => {
        if (String(id) === String(protectedUpload.id)) {
          await req.payload.update({
            id: originalLock.id,
            collection: 'payload-locked-documents',
            data: { user: { relationTo: 'users', value: newLockUser.id } },
            overrideAccess: true,
            req,
          })
        }

        if (String(id) === String(deletableUpload.id)) {
          await req.payload.create({
            collection: 'payload-locked-documents',
            data: {
              document: { relationTo: deletionSafetyMediaSlug, value: deletableUpload.id },
              user: { relationTo: 'users', value: deletingUser.id },
            },
            overrideAccess: true,
            req,
          })
        }
      }
      payload.db.bulkOperationsSingleTransaction = false

      try {
        const result = await payload.delete({
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
          overrideLock: false,
          user: { ...deletingUser, collection: 'users' },
          where: { id: { in: [protectedUpload.id, deletableUpload.id] } },
        })
        const remainingUploads = await payload.find({
          collection: deletionSafetyMediaSlug,
          overrideAccess: true,
          pagination: false,
          where: { id: { in: [protectedUpload.id, deletableUpload.id] } },
        })
        const remainingLocks = await payload.find({
          collection: 'payload-locked-documents',
          depth: 0,
          overrideAccess: true,
          pagination: false,
          where: {
            and: [
              { 'document.relationTo': { equals: deletionSafetyMediaSlug } },
              { 'document.value': { in: [protectedUpload.id, deletableUpload.id] } },
            ],
          },
        })

        expect(result.docs.map(({ id }) => id)).toEqual([deletableUpload.id])
        expect(result.errors).toHaveLength(1)
        expect(result.errors[0]?.id).toBe(protectedUpload.id)
        expect(result.errors[0]?.message).toContain('currently locked and cannot be deleted')
        expect(remainingUploads.docs.map(({ id }) => id)).toEqual([protectedUpload.id])
        expect(remainingLocks.docs).toHaveLength(1)
        expect(remainingLocks.docs[0]?.id).toBe(originalLock.id)
        expect(getRelationshipID(remainingLocks.docs[0]?.user?.value)).toBe(newLockUser.id)
      } finally {
        deletionSafetySpy.beforeUploadDelete = undefined
        payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
      }
    },
  )

  test('should reject a referenced branch upload before delete side effects run', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Referenced upload', payload })
    const fileData = Buffer.from('referenced branch upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'referenced branch upload' },
      draft: true,
      file: {
        name: 'referenced-branch-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)

    await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: { media: upload.id, title: 'main upload owner' },
      overrideAccess: true,
    })
    await payload.jobs.queue({
      input: {
        doc: {
          relationTo: deletionSafetyMediaSlug,
          value: upload.id,
        },
      },
      overrideAccess: true,
      task: 'schedulePublish',
      waitUntil: new Date(Date.now() + 60_000),
    })

    const versionsBeforeDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })

    resetDeletionSafetySpy()

    await expect(
      payload.delete({
        id: upload.id,
        branch: branch.slug,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })

    const versionsAfterDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })
    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: { 'input.doc.value': { equals: upload.id } },
    })

    expect(deletionSafetySpy.uploadBeforeDeleteCount).toBe(0)
    expect(deletionSafetySpy.uploadAfterDeleteCount).toBe(0)
    expect(fs.existsSync(filePath)).toBe(true)
    expect(versionsBeforeDelete.docs.length).toBeGreaterThan(0)
    expect(versionsAfterDelete.docs).toHaveLength(versionsBeforeDelete.docs.length)
    expect(scheduledJobs.docs).toHaveLength(1)
  })

  test('should reject a referenced branch upload before bulk delete side effects run', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Bulk referenced upload', payload })
    const user = await payload.create({
      collection: 'users',
      data: { email: 'bulk-reference-owner@example.com', password: 'test' },
      overrideAccess: true,
    })
    const userWithCollection = { ...user, collection: 'users' } as const
    const fileData = Buffer.from('bulk referenced branch upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'bulk referenced branch upload' },
      draft: true,
      file: {
        name: 'bulk-referenced-branch-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)
    const preference = await payload.create({
      collection: 'payload-preferences',
      data: {
        key: `collection-${deletionSafetyMediaSlug}-${upload.id}`,
        value: { test: true },
      },
      overrideAccess: true,
      user: userWithCollection,
    })
    const lock = await payload.create({
      collection: 'payload-locked-documents',
      data: {
        document: { relationTo: deletionSafetyMediaSlug, value: upload.id },
        user: { relationTo: 'users', value: user.id },
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: deletionSafetyOwnersSlug,
      data: { media: upload.id, title: 'main bulk upload owner' },
      overrideAccess: true,
    })
    await payload.jobs.queue({
      input: {
        doc: {
          relationTo: deletionSafetyMediaSlug,
          value: upload.id,
        },
      },
      overrideAccess: true,
      task: 'schedulePublish',
      waitUntil: new Date(Date.now() + 60_000),
    })

    const versionsBeforeDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })

    resetDeletionSafetySpy()

    const result = await payload.delete({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
      select: { alt: true },
      where: { id: { equals: upload.id } },
    })
    const versionsAfterDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })
    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: { 'input.doc.value': { equals: upload.id } },
    })
    const remainingLocks = await payload.find({
      collection: 'payload-locked-documents',
      overrideAccess: true,
      pagination: false,
      where: { id: { equals: lock.id } },
    })
    const remainingPreferences = await payload.find({
      collection: 'payload-preferences',
      overrideAccess: true,
      pagination: false,
      where: { id: { equals: preference.id } },
    })

    expect(result.docs).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain(branchReferenceErrorMessage)
    expect(deletionSafetySpy.uploadBeforeDeleteCount).toBe(0)
    expect(deletionSafetySpy.uploadAfterDeleteCount).toBe(0)
    expect(fs.existsSync(filePath)).toBe(true)
    expect(versionsBeforeDelete.docs.length).toBeGreaterThan(0)
    expect(versionsAfterDelete.docs).toHaveLength(versionsBeforeDelete.docs.length)
    expect(scheduledJobs.docs).toHaveLength(1)
    expect(remainingLocks.docs).toHaveLength(1)
    expect(remainingPreferences.docs).toHaveLength(1)
  })

  test('should finish every bulk delete hook before per-document transactions clean files', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Bulk hook reference barrier', payload })
    const sourceFileData = Buffer.from('source upload bytes')
    const targetFileData = Buffer.from('target upload bytes')
    const source = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'delayed source upload' },
      file: {
        name: 'delayed-source-upload.txt',
        data: sourceFileData,
        mimetype: 'text/plain',
        size: sourceFileData.length,
      },
      overrideAccess: true,
    })
    const target = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'referenced target upload' },
      file: {
        name: 'referenced-target-upload.txt',
        data: targetFileData,
        mimetype: 'text/plain',
        size: targetFileData.length,
      },
      overrideAccess: true,
    })
    const sourceFilePath = path.resolve(deletionSafetyMediaDirectory, source.filename)
    const targetFilePath = path.resolve(deletionSafetyMediaDirectory, target.filename)
    const filePathsByID = new Map([
      [String(source.id), sourceFilePath],
      [String(target.id), targetFilePath],
    ])
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

    resetDeletionSafetySpy()
    deletionSafetySpy.createUploadOwnerOnSecondBeforeDelete = true
    payload.db.bulkOperationsSingleTransaction = true

    let result

    try {
      result = await payload.delete({
        branch: branch.slug,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
        where: { id: { in: [source.id, target.id] } },
      })
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    const [referencedID, deletedID] = deletionSafetySpy.bulkDeleteHookIDs
    const remainingReferencedDocument = await payload.findByID({
      id: referencedID!,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      disableErrors: true,
      overrideAccess: true,
    })

    expect(deletionSafetySpy.bulkDeleteHookIDs).toHaveLength(2)
    expect(result.docs.map(({ id }) => String(id))).toEqual([String(deletedID)])
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      id: referencedID,
      message: expect.stringContaining(branchReferenceErrorMessage),
    })
    expect(remainingReferencedDocument?.id).toBe(referencedID)
    expect(fs.existsSync(filePathsByID.get(String(referencedID))!)).toBe(true)
    expect(fs.existsSync(filePathsByID.get(String(deletedID))!)).toBe(false)
  })

  test('should preserve branch upload side effects when the final reference guard blocks deletion', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Final reference guard', payload })
    const fileData = Buffer.from('final guard upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'final guard upload' },
      draft: true,
      file: {
        name: 'final-guard-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)

    await payload.jobs.queue({
      input: {
        doc: {
          relationTo: deletionSafetyMediaSlug,
          value: upload.id,
        },
      },
      overrideAccess: true,
      task: 'schedulePublish',
      waitUntil: new Date(Date.now() + 60_000),
    })

    const versionsBeforeDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })
    const originalDeleteOne = payload.db.deleteOne
    let hasCreatedOwner = false

    payload.db.deleteOne = async (args) => {
      if (
        !hasCreatedOwner &&
        args.collection === deletionSafetyMediaSlug &&
        (args.where as { id?: { equals?: unknown } }).id?.equals === upload.id
      ) {
        hasCreatedOwner = true

        await payload.create({
          collection: deletionSafetyOwnersSlug,
          data: { media: upload.id, title: 'owner created at final delete guard' },
          overrideAccess: true,
        })
      }

      return originalDeleteOne.call(payload.db, args)
    }

    let result

    try {
      result = await payload.delete({
        branch: branch.slug,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
        where: { id: { equals: upload.id } },
      })
    } finally {
      payload.db.deleteOne = originalDeleteOne
    }

    const remainingUpload = await payload.findByID({
      id: upload.id,
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      disableErrors: true,
      overrideAccess: true,
    })
    const versionsAfterDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })
    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: { 'input.doc.value': { equals: upload.id } },
    })

    expect(hasCreatedOwner).toBe(true)
    expect(result.docs).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]?.message).toContain(branchReferenceErrorMessage)
    expect(remainingUpload?.id).toBe(upload.id)
    expect(fs.existsSync(filePath)).toBe(true)
    expect(versionsAfterDelete.docs).toHaveLength(versionsBeforeDelete.docs.length)
    expect(scheduledJobs.docs).toHaveLength(1)
  })

  test('should clean up an unreferenced branch upload during a selected bulk delete', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Selected bulk upload cleanup', payload })
    const fileData = Buffer.from('selected bulk branch upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'selected bulk branch upload' },
      draft: true,
      file: {
        name: 'selected-bulk-branch-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)

    await payload.jobs.queue({
      input: {
        doc: {
          relationTo: deletionSafetyMediaSlug,
          value: upload.id,
        },
      },
      overrideAccess: true,
      task: 'schedulePublish',
      waitUntil: new Date(Date.now() + 60_000),
    })

    resetDeletionSafetySpy()

    const result = await payload.delete({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      overrideAccess: true,
      select: { alt: true },
      where: { id: { equals: upload.id } },
    })
    const remainingVersions = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })
    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: { 'input.doc.value': { equals: upload.id } },
    })

    expect(result.errors).toHaveLength(0)
    expect(result.docs).toHaveLength(1)
    expect(deletionSafetySpy.uploadBeforeDeleteCount).toBe(1)
    expect(deletionSafetySpy.uploadAfterDeleteCount).toBe(1)
    expect(fs.existsSync(filePath)).toBe(false)
    expect(remainingVersions.docs).toHaveLength(0)
    expect(scheduledJobs.docs).toHaveLength(0)
  })

  test('should recheck branch upload references created by a delete hook before cleanup', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Hook referenced upload', payload })
    const fileData = Buffer.from('hook referenced branch upload bytes')
    const upload = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyMediaSlug,
      data: { alt: 'hook referenced branch upload' },
      draft: true,
      file: {
        name: 'hook-referenced-branch-upload.txt',
        data: fileData,
        mimetype: 'text/plain',
        size: fileData.length,
      },
      overrideAccess: true,
    })
    const filePath = path.resolve(deletionSafetyMediaDirectory, upload.filename)

    await payload.jobs.queue({
      input: {
        doc: {
          relationTo: deletionSafetyMediaSlug,
          value: upload.id,
        },
      },
      overrideAccess: true,
      task: 'schedulePublish',
      waitUntil: new Date(Date.now() + 60_000),
    })

    const versionsBeforeDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })

    resetDeletionSafetySpy()
    deletionSafetySpy.createUploadOwnerOnBeforeDelete = true

    await expect(
      payload.delete({
        id: upload.id,
        branch: branch.slug,
        collection: deletionSafetyMediaSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ message: branchReferenceErrorMessage, status: 409 })

    const versionsAfterDelete = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyMediaSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: upload.id } },
    })
    const scheduledJobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: { 'input.doc.value': { equals: upload.id } },
    })

    expect(deletionSafetySpy.uploadBeforeDeleteCount).toBe(1)
    expect(deletionSafetySpy.uploadAfterDeleteCount).toBe(0)
    expect(deletionSafetySpy.hasCreatedUploadOwner).toBe(true)
    expect(fs.existsSync(filePath)).toBe(true)
    expect(versionsAfterDelete.docs).toHaveLength(versionsBeforeDelete.docs.length)
    expect(scheduledJobs.docs).toHaveLength(1)
  })

  test('should restore pruned branch versions after a non-transactional create merge is rejected', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Rejected versioned create', payload })
    const target = await payload.create({
      branch: branch.slug,
      collection: deletionSafetyVersionedTargetsSlug,
      data: { title: 'first branch draft' },
      draft: true,
      overrideAccess: true,
    })

    await payload.update({
      id: target.id,
      branch: branch.slug,
      collection: deletionSafetyVersionedTargetsSlug,
      data: { title: 'second branch draft' },
      draft: true,
      overrideAccess: true,
    })

    const versionsBeforeMerge = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyVersionedTargetsSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: target.id } },
    })
    const beginTransaction = payload.db.beginTransaction

    deletionSafetySpy.rejectVersionedTargetCreate = true
    payload.db.beginTransaction = () => Promise.resolve(null)

    try {
      await expect(
        payload.branches.merge({ branch: branch.slug, overrideAccess: true }),
      ).rejects.toThrow('Rejected after saving the merge version')
    } finally {
      payload.db.beginTransaction = beginTransaction
      deletionSafetySpy.rejectVersionedTargetCreate = false
    }

    const versionsAfterMerge = await payload.db.findVersions({
      branch: false,
      collection: deletionSafetyVersionedTargetsSlug,
      limit: 0,
      pagination: false,
      where: { parent: { equals: target.id } },
    })
    const getVersionState = (versions: typeof versionsBeforeMerge.docs) =>
      versions
        .map(({ id, latest, version }) => ({
          id: String(id),
          branch: version._branch,
          isLatest: latest === true,
          title: version.title,
        }))
        .sort((left, right) => left.id.localeCompare(right.id))

    expect(versionsBeforeMerge.docs).toHaveLength(2)
    expect(deletionSafetySpy.mainContentVisibleDuringRejectedCreate).toBe(false)
    expect(getVersionState(versionsAfterMerge.docs)).toEqual(
      getVersionState(versionsBeforeMerge.docs),
    )
  })

  test('should keep branch status fields under server control during create', async ({
    payload,
  }) => {
    const user = await payload.create({
      collection: 'users',
      data: { email: 'branch-field-writer@example.com', password: 'test' },
      overrideAccess: true,
    })

    const branch = await payload.create({
      collection: branchesSlug,
      data: {
        name: 'Protected create fields',
        mergedAt: new Date().toISOString(),
        mergeProgress: '999/999',
        status: 'closed',
      },
      overrideAccess: false,
      user: { ...user, collection: 'users' },
    })

    expect(branch.mergeProgress).toBeFalsy()
    expect(branch.mergedAt).toBeFalsy()
    expect(branch.status).toBe('open')
  })

  test('should delete a branch when its scheduled merge lease has expired', async ({ payload }) => {
    const branch = await createBranch({ name: 'Expired merge lease', payload })
    const job = await payload.create({
      collection: 'payload-jobs',
      data: {
        input: { branch: branch.slug },
        processingUntil: new Date(Date.now() - 60_000).toISOString(),
        taskSlug: 'scheduleMerge',
        waitUntil: new Date(Date.now() - 120_000).toISOString(),
      },
      overrideAccess: true,
    })

    await payload.delete({
      id: branch.id,
      collection: branchesSlug,
      overrideAccess: true,
    })

    const remainingJob = await payload.findByID({
      id: job.id,
      collection: 'payload-jobs',
      disableErrors: true,
      overrideAccess: true,
    })

    expect(remainingJob).toBeNull()
  })

  test('should preserve every scheduled merge when an active lease blocks branch deletion', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Active and queued merges', payload })
    const activeJob = await payload.create({
      collection: 'payload-jobs',
      data: {
        input: { branch: branch.slug },
        processingUntil: new Date(Date.now() + 60_000).toISOString(),
        taskSlug: 'scheduleMerge',
        waitUntil: new Date(Date.now() - 60_000).toISOString(),
      },
      overrideAccess: true,
    })
    const queuedJob = await payload.create({
      collection: 'payload-jobs',
      data: {
        input: { branch: branch.slug },
        taskSlug: 'scheduleMerge',
        waitUntil: new Date(Date.now() + 60_000).toISOString(),
      },
      overrideAccess: true,
    })

    await expect(
      payload.delete({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ status: 409 })

    const jobs = await payload.find({
      collection: 'payload-jobs',
      overrideAccess: true,
      pagination: false,
      where: { id: { in: [activeJob.id, queuedJob.id] } },
    })

    expect(jobs.docs.map(({ id }: { id: number | string }) => String(id)).sort()).toEqual(
      [activeJob.id, queuedJob.id].map(String).sort(),
    )
  })

  test('should recheck active scheduled merge leases after deleting stale jobs', async ({
    payload,
  }) => {
    const branch = await createBranch({ name: 'Lease created during cleanup', payload })
    const target = await createBranchTarget({ branch: branch.slug, payload })

    await payload.create({
      collection: 'payload-jobs',
      data: {
        completedAt: new Date().toISOString(),
        input: { branch: branch.slug },
        taskSlug: 'scheduleMerge',
        waitUntil: new Date(Date.now() - 120_000).toISOString(),
      },
      overrideAccess: true,
    })
    deletionSafetySpy.activeLeaseBranchOnCompletedJobDelete = branch.slug

    await expect(
      payload.delete({
        id: branch.id,
        collection: branchesSlug,
        overrideAccess: true,
      }),
    ).rejects.toMatchObject({ status: 409 })

    expect(deletionSafetySpy.hasCreatedRaceJob).toBe(true)
    await expectTargetToRemain({ id: target.id, branch: branch.slug, payload })
  })
})
