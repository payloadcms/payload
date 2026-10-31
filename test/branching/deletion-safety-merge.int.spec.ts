import type { Payload } from 'payload'

import fs from 'fs'

import { createPayloadRequest } from 'payload'

import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

import {
  deletionSafetyMediaDirectory,
  deletionSafetyMediaSlug,
  deletionSafetyOwnersSlug,
  deletionSafetyTargetsSlug,
  deletionSafetyVersionedGlobalSlug,
  deletionSafetyVersionedTargetsSlug,
} from './deletion-safety.config.js'

import { deletionSafetySpy, resetDeletionSafetySpy } from './deletionSafetySpy.js'

import { branchesSlug } from './shared.js'

const createBranch = async ({ name, payload }: { name: string; payload: Payload }) =>
  payload.create({
    collection: branchesSlug,
    data: { name },
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

test.suite('Branch deletion safety', { config: './deletion-safety.config.ts' }, () => {
  test.beforeEach(() => {
    resetDeletionSafetySpy()
  })

  test.afterEach(async () => {
    await fs.promises.rm(deletionSafetyMediaDirectory, { force: true, recursive: true })
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
})
