import type { PayloadRequest, Where } from '../../../types/index.js'
import type {
  BranchContentScope,
  BranchHead,
  BranchHeadID,
  BranchHeadState,
  BranchHeadToken,
} from '../types.js'

import { decodeBranchHead } from './decodeBranchHead.js'

type Target = {
  /** Per-entity internal storage collection, never a user-supplied content collection. */
  collection: string
  /** Omitted only for a global's singleton head storage. */
  parentID?: BranchHeadID
}

export const readBranchHead = async ({
  branchID,
  req,
  scope,
  target,
}: {
  branchID: BranchHeadID
  req: PayloadRequest
  scope: BranchContentScope
  target: Target
}): Promise<BranchHead | null> => {
  assertHeadTarget({ req, target })

  const row = await req.payload.db.findOne({
    collection: target.collection,
    req,
    where: getHeadWhere({ branchID, scope, target }),
  })

  return row ? decodeBranchHead({ branchID, row, scope }) : null
}

/**
 * Internal persistence after authorization and version freezing. This does not pin or validate
 * content. Never pass `id` to updateOne: adapters can then ignore the generation predicate.
 * An absent-head create conflict propagates so an owning transaction can roll back and retry.
 */
export const writeBranchHead = async ({
  base,
  expected,
  nextState,
  req,
  target,
}: {
  base?: BranchHeadToken | null
  expected: BranchHeadToken
  nextState: BranchHeadState
  req: PayloadRequest
  target: Target
}): Promise<BranchHead | null> => {
  assertHeadTarget({ req, target })

  if ((expected.incarnation ?? 0) !== 0 || (base?.incarnation ?? 0) !== 0) {
    throw new Error(
      'Durable branch incarnation persistence is required before writing discarded scopes.',
    )
  }

  if (
    expected.generation !== null &&
    (!Number.isSafeInteger(expected.generation) ||
      expected.generation < 1 ||
      expected.generation === Number.MAX_SAFE_INTEGER)
  ) {
    throw new Error('Cannot advance an invalid or exhausted branch head generation.')
  }

  const generation = expected.generation === null ? 1 : expected.generation + 1
  const version = nextState.type === 'version' ? nextState.version : null
  const structure = nextState.type === 'version' ? nextState.structure : null
  const data = {
    ...(base !== undefined ? { base } : {}),
    generation,
    state: nextState.type,
    structureVersionGeneration: structure?.generation ?? null,
    structureVersionID: structure?.id ?? null,
    versionGeneration: version?.generation ?? null,
    versionID: version?.id ?? null,
  }

  // Reject malformed version references before a database mutation, including raw trusted calls.
  decodeBranchHead({ branchID: expected.branchID, row: data, scope: expected.scope })

  if (expected.generation === null) {
    const row = await req.payload.db.create({
      collection: target.collection,
      data: {
        ...data,
        base: base ?? null,
        branchKey: getBranchKey({ branchID: expected.branchID }),
        ...(target.parentID !== undefined ? { parent: target.parentID } : {}),
        scopeKey: getScopeKey({ scope: expected.scope }),
      },
      req,
    })

    return decodeBranchHead({ branchID: expected.branchID, row, scope: expected.scope })
  }

  const row = await req.payload.db.updateOne({
    collection: target.collection,
    data,
    options: { atomic: true },
    req,
    where: {
      and: [
        getHeadWhere({ branchID: expected.branchID, scope: expected.scope, target }),
        { generation: { equals: expected.generation } },
      ],
    },
  })

  return row ? decodeBranchHead({ branchID: expected.branchID, row, scope: expected.scope }) : null
}

const getHeadWhere = ({
  branchID,
  scope,
  target,
}: {
  branchID: BranchHeadID
  scope: BranchContentScope
  target: Target
}): Where => ({
  and: [
    { branchKey: { equals: getBranchKey({ branchID }) } },
    { scopeKey: { equals: getScopeKey({ scope }) } },
    ...(target.parentID !== undefined ? [{ parent: { equals: target.parentID } }] : []),
  ],
})

const getBranchKey = ({ branchID }: { branchID: BranchHeadID }): string => {
  if ((typeof branchID === 'number' && !Number.isSafeInteger(branchID)) || branchID === '') {
    throw new Error('Invalid branch identity.')
  }

  return `${typeof branchID === 'number' ? 'number' : 'string'}:${branchID}`
}

const getScopeKey = ({ scope }: { scope: BranchContentScope }): string => {
  if (scope.type === 'shared') {
    return 'shared'
  }

  if (!scope.locale.length) {
    throw new Error('A branch locale scope requires a locale code.')
  }

  return `locale:${scope.locale}`
}

const assertHeadTarget = ({ req, target }: { req: PayloadRequest; target: Target }): void => {
  const storage = req.payload.collections[target.collection]?.config.custom?.branchHeadStorage

  if (!storage || typeof storage !== 'object' || !Object.hasOwn(storage, 'parentCollection')) {
    throw new Error('Branch heads require a registered internal head storage collection.')
  }

  if ((storage.parentCollection !== null) !== (target.parentID !== undefined)) {
    throw new Error('Branch head parent identity does not match its storage collection.')
  }
}
