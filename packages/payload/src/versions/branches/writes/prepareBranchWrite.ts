import { randomUUID } from 'node:crypto'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BranchStorageTarget } from '../storage/branchStorage.js'
import type { BranchContentScope, BranchHeadID, BranchHeadToken } from '../types.js'

import { areBranchHeadTokensEqual } from '../compareBranchHeads.js'
import { readBranchHead, readBranchHeads } from '../storage/branchHeadStore.js'
import { assertBranchTransaction } from '../storage/branchStorage.js'

type BranchWriteCutover = {
  collection: string
  generation: number
  id: number | string
  migrationID: string
}

export type BranchWriteObservation = {
  bases: readonly { base: BranchHeadToken | null; scope: BranchContentScope }[]
  cutover: BranchWriteCutover
  isCreate: boolean
  readSet: readonly BranchHeadToken[]
  scopes: readonly BranchContentScope[]
  target: BranchStorageTarget
}

/** Read a durable cutover receipt, not cache readiness. No public input activates this path. */
export const prepareBranchWrite = async ({
  id,
  collection,
  global,
  isCreate = false,
  req,
}: {
  collection?: SanitizedCollectionConfig
  global?: SanitizedGlobalConfig
  id?: BranchHeadID
  isCreate?: boolean
  req?: PayloadRequest
}): Promise<BranchWriteObservation | null> => {
  const entity = collection ?? global

  const cutover = entity && req ? await readBranchWriteCutover({ entity, req }) : null

  if (!req || !entity || !cutover) {
    return null
  }
  await assertBranchTransaction({ req })
  await assertBranchWriteCutover({ cutover, req })
  if (collection && !isCreate && id === undefined) {
    throw new Error('A branch collection write requires its logical document identity.')
  }
  const target: BranchStorageTarget = {
    collection: entity.custom.branchStorage.heads,
    ...(collection && id !== undefined ? { parentID: id } : {}),
  }
  const scopes: BranchContentScope[] = [
    { type: 'shared' },
    ...(req.payload.config.localization
      ? req.payload.config.localization.localeCodes.map((locale): BranchContentScope => ({
          type: 'locale',
          locale,
        }))
      : []),
  ]
  const selections = scopes.flatMap((scope) => [
    { branchID: 'main', scope },
    { branchID: 'drafts', scope },
  ])

  const readSet = isCreate
    ? selections.map(({ branchID, scope }): BranchHeadToken => ({
        branchID,
        generation: null,
        incarnation: 0,
        scope,
        state: null,
      }))
    : await readBranchHeads({ req, selections, target })
  const bases: { base: BranchHeadToken | null; scope: BranchContentScope }[] = []

  if (!isCreate) {
    for (const scope of scopes) {
      const head = await readBranchHead({ branchID: 'drafts', req, scope, target })

      if (head) {
        bases.push({ base: head.base ?? null, scope })
      }
    }
  }

  if (!isCreate) {
    const verified = await readBranchHeads({ req, selections, target })

    if (
      readSet.some(
        (token, index) => !areBranchHeadTokensEqual({ left: token, right: verified[index]! }),
      )
    ) {
      throw new Error('Branch heads changed while capturing operation observations.')
    }
  }

  return {
    bases,
    cutover,
    isCreate,
    readSet,
    scopes,
    target,
  }
}

/** Authority is durable migration state; arbitrary application custom keys are never opt-in. */
export const isBranchWriteEngineActive = async (args: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  req?: PayloadRequest
}): Promise<boolean> => Boolean(await readBranchWriteCutover(args))

/** Native row dependency fences cutover/rollback against all writes in this caller transaction. */
export const assertBranchWriteCutover = async ({
  cutover,
  req,
}: {
  cutover: BranchWriteCutover
  req: PayloadRequest
}): Promise<void> => {
  const locked = await req.payload.db.updateOne({
    collection: cutover.collection,
    data: { lockNonce: randomUUID() },
    options: { atomic: true },
    req,
    where: {
      and: [
        { id: { equals: cutover.id } },
        { singleton: { equals: 'authoritative' } },
        { generation: { equals: cutover.generation } },
        { migrationID: { equals: cutover.migrationID } },
        { schemaGeneration: { equals: 1 } },
        { isActivated: { equals: true } },
      ],
    },
  })

  if (!locked) {
    throw new Error('Authoritative branch cutover changed during the operation.')
  }
}

const readBranchWriteCutover = async ({
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
