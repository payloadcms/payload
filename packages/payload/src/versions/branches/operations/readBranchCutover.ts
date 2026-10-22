import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'

export type BranchWriteCutover = {
  collection: string
  generation: number
  id: number | string
  migrationID: string
}

export const readBranchCutover = async ({
  entity,
  req,
}: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  req?: PayloadRequest
}): Promise<BranchWriteCutover | null> => {
  const storage = entity.custom?.branchStorage
  const cutoverSlug = storage?.cutover

  if (!req || typeof cutoverSlug !== 'string' || !entity.custom?.branchQueryStorage) {
    return null
  }
  const marker = req.payload.collections[cutoverSlug]?.config.custom?.branchCutoverStorage
  const headMarker = req.payload.collections[storage.heads]?.config.custom?.branchHeadStorage
  const isCollection = req.payload.collections[entity.slug]?.config === entity

  if (
    !marker ||
    !headMarker ||
    marker.parentCollection !== (isCollection ? entity.slug : undefined) ||
    marker.globalSlug !== (isCollection ? undefined : entity.slug) ||
    headMarker.parentCollection !== (isCollection ? entity.slug : null) ||
    headMarker.globalSlug !== (isCollection ? null : entity.slug)
  ) {
    return null
  }
  const cutover = await req.payload.db.findOne<{
    generation: number
    id: number | string
    isActivated: boolean
    migrationID: string
    schemaGeneration: number
  }>({
    collection: cutoverSlug,
    req,
    where: { singleton: { equals: 'authoritative' } },
  })

  if (!cutover) {
    return null
  }
  if (cutover.schemaGeneration !== 1 || cutover.isActivated !== true) {
    throw new Error('The authoritative branch cutover is inactive or unsupported.')
  }
  if (!Number.isSafeInteger(cutover.generation) || cutover.generation < 1 || !cutover.migrationID) {
    throw new Error('The authoritative branch cutover receipt is invalid.')
  }

  return {
    id: cutover.id,
    collection: cutoverSlug,
    generation: cutover.generation,
    migrationID: cutover.migrationID,
  }
}
