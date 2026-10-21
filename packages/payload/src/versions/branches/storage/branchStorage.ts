import type { BranchStorageEntity } from '../../../database/branching.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

export type BranchStorageTarget = { collection: string; parentID?: BranchHeadID }

export const getBranchStorage = ({
  req,
  target,
}: {
  req: PayloadRequest
  target: BranchStorageTarget
}): {
  entity: BranchStorageEntity
  heads: string
  identities: string
  pins: string
} => {
  const marker = req.payload.collections[target.collection]?.config.custom?.branchHeadStorage

  if (!marker || typeof marker !== 'object') {
    throw new Error('Branch heads require a registered internal head storage collection.')
  }

  let entity: BranchStorageEntity

  if (typeof marker.parentCollection === 'string' && target.parentID !== undefined) {
    entity = { slug: marker.parentCollection, type: 'collection', parentID: target.parentID }
  } else if (
    marker.parentCollection === null &&
    typeof marker.globalSlug === 'string' &&
    target.parentID === undefined
  ) {
    entity = { slug: marker.globalSlug, type: 'global' }
  } else {
    throw new Error('Branch head parent identity does not match its storage collection.')
  }

  const config =
    entity.type === 'collection'
      ? req.payload.collections[entity.slug]?.config
      : req.payload.globals.config.find(({ slug }) => slug === entity.slug)
  const storage = config?.custom?.branchStorage

  if (
    !storage ||
    storage.heads !== target.collection ||
    typeof storage.pins !== 'string' ||
    typeof storage.identities !== 'string'
  ) {
    throw new Error('Branch storage is not registered for this entity.')
  }

  return { entity, heads: storage.heads, identities: storage.identities, pins: storage.pins }
}

export const assertBranchTransaction = async ({ req }: { req: PayloadRequest }): Promise<void> => {
  const adapter = req.payload.db.branching

  if (!adapter) {
    throw new Error(
      'This database adapter does not support named content branches. Legacy drafts remain available.',
    )
  }

  const capabilities = await adapter.capabilities({ req })
  const transactionID = req.transactionID == null ? null : await req.transactionID

  if (
    !capabilities.interactiveTransactions ||
    transactionID === null ||
    !req.payload.db.sessions?.[transactionID]
  ) {
    throw new Error(
      `Branch storage requires an active caller transaction.${capabilities.reason ? ` ${capabilities.reason}` : ''}`,
    )
  }
}

export const getBranchKey = ({ branchID }: { branchID: BranchHeadID }): string => {
  if (
    (typeof branchID !== 'number' || !Number.isSafeInteger(branchID)) &&
    (typeof branchID !== 'string' || !branchID.length)
  ) {
    throw new Error('Invalid branch identity.')
  }

  return `${typeof branchID === 'number' ? 'number' : 'string'}:${branchID}`
}
