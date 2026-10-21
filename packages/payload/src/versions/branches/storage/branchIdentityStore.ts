import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'
import type { BranchStorageTarget } from './branchStorage.js'

import { hasLocalizeStatusEnabled } from '../../../utilities/getVersionsConfig.js'
import { assertBranchTransaction, getBranchKey, getBranchStorage } from './branchStorage.js'

export type BranchIdentityVisibility = {
  generation: number
  isLegacyDraftVisible: boolean
  isPublished: boolean
  ownerKey: string
}

/** Allocate the existing typed anchor and its visibility metadata without application hooks. */
export const allocateBranchIdentity = async ({
  branchID,
  collection,
  data,
  isLegacyDraftVisible,
  req,
}: {
  branchID: BranchHeadID
  collection: string
  data: JsonObject
  isLegacyDraftVisible: boolean
  req: PayloadRequest
}): Promise<{ id: BranchHeadID; visibility: BranchIdentityVisibility }> => {
  await assertBranchTransaction({ req })
  const heads = req.payload.collections[collection]?.config.custom?.branchStorage?.heads

  if (typeof heads !== 'string') {
    throw new Error('Identity allocation requires registered branch storage.')
  }

  const config = req.payload.collections[collection]!.config
  const status =
    hasLocalizeStatusEnabled(config) && req.payload.config.localization
      ? Object.fromEntries(
          req.payload.config.localization.localeCodes.map((locale) => [locale, 'draft']),
        )
      : 'draft'
  const row = await req.payload.db.create({
    collection,
    data: { ...data, _status: status },
    draft: true,
    req,
  })
  const target = { collection: heads, parentID: row.id }
  const visibility = await createBranchIdentityVisibility({
    branchID,
    isLegacyDraftVisible,
    req,
    target,
  })

  return { id: row.id, visibility }
}

export const createBranchIdentityVisibility = async ({
  branchID,
  isLegacyDraftVisible,
  req,
  target,
}: {
  branchID: BranchHeadID
  isLegacyDraftVisible: boolean
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<BranchIdentityVisibility> => {
  await assertBranchTransaction({ req })
  const { identities } = getBranchStorage({ req, target })
  const data = {
    generation: 1,
    isLegacyDraftVisible,
    isPublished: false,
    ownerKey: getBranchKey({ branchID }),
    ...(target.parentID !== undefined ? { parent: target.parentID } : {}),
    singleton: 'singleton',
  }

  await req.payload.db.create({ collection: identities, data, req })

  return data
}

export const readBranchIdentityVisibility = async ({
  req,
  target,
}: {
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<BranchIdentityVisibility | null> => {
  const { identities } = getBranchStorage({ req, target })
  const row = await req.payload.db.findOne<{ id: BranchHeadID } & BranchIdentityVisibility>({
    collection: identities,
    req,
    where:
      target.parentID !== undefined
        ? { parent: { equals: target.parentID } }
        : { singleton: { equals: 'singleton' } },
  })

  return row
    ? {
        generation: row.generation,
        isLegacyDraftVisible: row.isLegacyDraftVisible,
        isPublished: row.isPublished,
        ownerKey: row.ownerKey,
      }
    : null
}

export const updateBranchIdentityVisibility = async ({
  expectedGeneration,
  isPublished,
  req,
  target,
}: {
  expectedGeneration: number
  isPublished: boolean
  req: PayloadRequest
  target: BranchStorageTarget
}): Promise<BranchIdentityVisibility | null> => {
  await assertBranchTransaction({ req })
  const { identities } = getBranchStorage({ req, target })

  if (
    !Number.isSafeInteger(expectedGeneration) ||
    expectedGeneration < 1 ||
    expectedGeneration === Number.MAX_SAFE_INTEGER
  ) {
    throw new Error('Invalid identity visibility generation.')
  }

  const row = await req.payload.db.updateOne({
    collection: identities,
    data: { generation: expectedGeneration + 1, isPublished },
    options: { atomic: true },
    req,
    where: {
      and: [
        target.parentID !== undefined
          ? { parent: { equals: target.parentID } }
          : { singleton: { equals: 'singleton' } },
        { generation: { equals: expectedGeneration } },
      ],
    },
  })

  return row
    ? {
        generation: row.generation as number,
        isLegacyDraftVisible: row.isLegacyDraftVisible as boolean,
        isPublished: row.isPublished as boolean,
        ownerKey: row.ownerKey as string,
      }
    : null
}

export const isBranchIdentityVisible = ({
  branchID,
  visibility,
}: {
  branchID: BranchHeadID
  visibility: BranchIdentityVisibility
}): boolean =>
  visibility.isPublished ||
  visibility.ownerKey === getBranchKey({ branchID }) ||
  (branchID === 'drafts' && visibility.isLegacyDraftVisible)
