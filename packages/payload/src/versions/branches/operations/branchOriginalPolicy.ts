import type { PayloadRequest, Where } from '../../../types/index.js'
import type { BranchHeadID } from '../types.js'

const grants = new WeakMap<
  object,
  {
    overrideAccess: boolean
    req: PayloadRequest
    transactionID: PayloadRequest['transactionID']
    where: Where
  }
>()
const policies = new WeakMap<
  object,
  {
    branchID: BranchHeadID
    collection: string
    overrideAccess: boolean
    req: PayloadRequest
    transactionID: PayloadRequest['transactionID']
    where: Where
  }
>()

/** A single-use root authorization receipt; relationship policies remain independent. */
export const createBranchOriginalPolicy = ({
  branchID,
  collection,
  overrideAccess = false,
  req,
  where,
}: {
  branchID: BranchHeadID
  collection: string
  overrideAccess?: boolean
  req: PayloadRequest
  where: Where
}): object => {
  const policy = Object.freeze({})
  policies.set(policy, {
    branchID,
    collection,
    overrideAccess,
    req,
    transactionID: req.transactionID,
    where: structuredClone(where),
  })
  return policy
}

export const consumeBranchOriginalPolicy = ({
  branchID,
  collection,
  policy,
  req,
}: {
  branchID: BranchHeadID
  collection: string
  policy?: object
  req: PayloadRequest
}): object | undefined => {
  if (!policy) {
    return undefined
  }
  const bound = policies.get(policy)
  policies.delete(policy)
  if (
    !bound ||
    bound.branchID !== branchID ||
    bound.collection !== collection ||
    bound.req !== req ||
    !Object.is(bound.transactionID, req.transactionID)
  ) {
    throw new Error('The original-operation authorization receipt is invalid or expired.')
  }
  const grant = Object.freeze({})
  grants.set(grant, {
    overrideAccess: bound.overrideAccess,
    req: bound.req,
    transactionID: bound.transactionID,
    where: bound.where,
  })
  return grant
}

export const readBranchOriginalGrant = ({
  grant,
}: {
  grant?: object
}): { overrideAccess: boolean; where: Where } | undefined => {
  if (grant === undefined) {
    return undefined
  }
  const where = grants.get(grant)
  if (where === undefined || !Object.is(where.req.transactionID, where.transactionID)) {
    throw new Error('Invalid original-operation grant.')
  }
  return { overrideAccess: where.overrideAccess, where: structuredClone(where.where) }
}
