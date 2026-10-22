import { randomUUID } from 'node:crypto'

import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { BranchWriteCutover } from '../operations/readBranchCutover.js'
import type { BranchStorageTarget } from '../storage/branchStorage.js'
import type { BranchContentScope, BranchHeadID, BranchHeadToken } from '../types.js'

import { areBranchHeadTokensEqual } from '../compareBranchHeads.js'
import { readBranchCutover } from '../operations/readBranchCutover.js'
import { getSelectedBranch, isWorkingBranchSelected } from '../operations/selectedBranchContext.js'
import { readBranchHead, readBranchHeads } from '../storage/branchHeadStore.js'
import { assertBranchTransaction } from '../storage/branchStorage.js'

export type BranchWriteObservation = {
  bases: readonly { base: BranchHeadToken | null; scope: BranchContentScope }[]
  cutover: BranchWriteCutover
  isCreate: boolean
  readSet: readonly BranchHeadToken[]
  scopes: readonly BranchContentScope[]
  target: BranchStorageTarget
  workingBranchID: BranchHeadID
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

  const cutover = entity && req ? await readBranchCutover({ entity, req }) : null

  if (!req || !entity || !cutover) {
    if (isWorkingBranchSelected({ req })) {
      throw new Error('Named branch writes require an authoritative cutover and supported entity.')
    }
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
  const workingBranchID = getSelectedBranch({ req }) ?? 'drafts'
  const selections = scopes.flatMap((scope) => [
    { branchID: 'main', scope },
    { branchID: workingBranchID, scope },
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
      const head = await readBranchHead({ branchID: workingBranchID, req, scope, target })

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
    workingBranchID,
  }
}

/** Authority is durable migration state; arbitrary application custom keys are never opt-in. */
export const isBranchWriteEngineActive = async (args: {
  entity: SanitizedCollectionConfig | SanitizedGlobalConfig
  req?: PayloadRequest
}): Promise<boolean> => Boolean(await readBranchCutover(args))

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
