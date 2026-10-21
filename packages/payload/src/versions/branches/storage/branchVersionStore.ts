import type { BranchStorageEntity } from '../../../database/branching.js'
import type { JsonObject, PayloadRequest, Where } from '../../../types/index.js'
import type { BranchHeadID, BranchVersionReference } from '../types.js'
import type { BranchStorageTarget } from './branchStorage.js'

import { assertBranchTransaction, getBranchKey, getBranchStorage } from './branchStorage.js'

export const readBranchVersion = async ({
  entity,
  req,
  versionID,
}: {
  entity: BranchStorageEntity
  req: PayloadRequest
  versionID: BranchHeadID
}): Promise<null | Record<string, unknown>> => {
  const where: Where = {
    and: [
      { id: { equals: versionID } },
      ...(entity.type === 'collection' ? [{ parent: { equals: entity.parentID } }] : []),
    ],
  }
  const args = { limit: 1, locale: 'all', pagination: false, req, where }
  const result =
    entity.type === 'collection'
      ? await req.payload.db.findVersions({ ...args, collection: entity.slug })
      : await req.payload.db.findGlobalVersions({ ...args, global: entity.slug })

  return result.docs[0] ?? null
}

/** Adopt an existing legacy snapshot under the caller's migration/write transaction. */
export const initializeBranchVersion = async ({
  branchID,
  isFrozen,
  req,
  target,
  versionID,
}: {
  branchID: BranchHeadID
  isFrozen: boolean
  req: PayloadRequest
  target: BranchStorageTarget
  versionID: BranchHeadID
}): Promise<BranchVersionReference> => {
  await assertBranchTransaction({ req })
  const { entity } = getBranchStorage({ req, target })
  const row = await req.payload.db.branching!.mutateVersion({
    entity,
    expected: { id: versionID, generation: 0 },
    mutation: { type: 'initialize', isFrozen, ownerKey: getBranchKey({ branchID }) },
    req,
  })

  if (!row) {
    throw new Error(
      'Version is missing, belongs to another identity, or already has branch metadata.',
    )
  }

  return { id: versionID, generation: 1 }
}

/** Freezing and recording the durable root happen in the same caller transaction. */
export const pinBranchVersion = async ({
  reference,
  req,
  rootKey,
  target,
}: {
  reference: BranchVersionReference
  req: PayloadRequest
  rootKey: string
  target: BranchStorageTarget
}): Promise<BranchVersionReference> => {
  await assertBranchTransaction({ req })
  const { entity, pins } = getBranchStorage({ req, target })

  if (
    !rootKey ||
    !Number.isSafeInteger(reference.generation) ||
    reference.generation < 1 ||
    ((typeof reference.id !== 'number' || !Number.isSafeInteger(reference.id)) &&
      (typeof reference.id !== 'string' || !reference.id.length))
  ) {
    throw new Error('A version pin requires an exact generation and durable root identity.')
  }

  const row = await req.payload.db.branching!.mutateVersion({
    entity,
    expected: reference,
    mutation: { type: 'freeze' },
    req,
  })

  if (!row) {
    throw new Error('Cannot pin a missing, wrong-parent, unmanaged, or stale version revision.')
  }

  const where: Where = {
    and: [
      { versionID: { equals: reference.id } },
      { rootKey: { equals: rootKey } },
      ...(target.parentID !== undefined ? [{ parent: { equals: target.parentID } }] : []),
    ],
  }
  const existing = await req.payload.db.findOne<{ [key: string]: unknown; id: number | string }>({
    collection: pins,
    req,
    where,
  })

  if (existing) {
    if (existing.versionGeneration !== reference.generation) {
      throw new Error('A durable version root cannot select a different revision.')
    }
  } else {
    await req.payload.db.create({
      collection: pins,
      data: {
        ...(target.parentID !== undefined ? { parent: target.parentID } : {}),
        rootKey,
        versionGeneration: reference.generation,
        versionID: reference.id,
      },
      req,
    })
  }

  return reference
}

/** An immutable or differently owned autosave gets a new native version identity. */
export const saveBranchAutosave = async ({
  branchID,
  data,
  expected,
  req,
  target,
}: {
  branchID: BranchHeadID
  data: JsonObject
  expected: BranchVersionReference
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<BranchVersionReference> => {
  await assertBranchTransaction({ req })
  const { entity } = getBranchStorage({ req, target })
  const row = await readBranchVersion({ entity, req, versionID: expected.id })

  if (!row || row.branchGeneration !== expected.generation) {
    throw new Error('Autosave version revision changed.')
  }

  const ownerKey = getBranchKey({ branchID })

  if (row.branchFrozen !== true && row.branchOwnerKey === ownerKey) {
    const updated = await req.payload.db.branching!.mutateVersion({
      entity,
      expected,
      mutation: { type: 'replace', data, ownerKey },
      req,
    })

    if (!updated) {
      throw new Error('Autosave version revision changed or was pinned concurrently.')
    }

    return { id: expected.id, generation: expected.generation + 1 }
  }

  const timestamp = new Date().toISOString()
  const args = {
    autosave: true,
    branchMode: true as const,
    createdAt: timestamp,
    req,
    updatedAt: timestamp,
    versionData: data,
  }
  const created =
    entity.type === 'collection'
      ? await req.payload.db.createVersion({
          ...args,
          collectionSlug: entity.slug,
          parent: entity.parentID,
        })
      : await req.payload.db.createGlobalVersion({ ...args, globalSlug: entity.slug })

  return initializeBranchVersion({ branchID, isFrozen: false, req, target, versionID: created.id })
}
