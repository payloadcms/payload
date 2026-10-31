import type { Payload, PayloadRequest } from '../../types/index.js'

import { APIError } from '../../errors/index.js'
import { isolateObjectProperty } from '../../utilities/isolateObjectProperty.js'
import { branchesCollectionSlug } from '../types.js'

const createBranchStatusRequest = ({ req }: { req: PayloadRequest }): PayloadRequest => {
  const statusReq = isolateObjectProperty(req, 'transactionID')

  delete statusReq.transactionID

  return statusReq
}

export const beginBranchMerge = async ({
  branchDocID,
  payload,
  req,
}: {
  branchDocID: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  const updatedBranch = await payload.db.updateOne({
    branch: false,
    collection: branchesCollectionSlug,
    data: { status: 'merging', updatedAt: new Date().toISOString() },
    options: { atomic: true },
    req: createBranchStatusRequest({ req }),
    where: {
      and: [{ id: { equals: branchDocID } }, { status: { equals: 'open' } }],
    },
  })

  if (!updatedBranch) {
    throw new APIError('This branch is already being merged or is not open.', 409)
  }
}

export const restoreBranchAfterMerge = async ({
  branchDocID,
  payload,
  req,
}: {
  branchDocID: number | string
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  await payload.db.updateOne({
    branch: false,
    collection: branchesCollectionSlug,
    data: { mergedAt: null, status: 'open', updatedAt: new Date().toISOString() },
    options: { atomic: true },
    req: createBranchStatusRequest({ req }),
    where: {
      and: [{ id: { equals: branchDocID } }, { status: { equals: 'merging' } }],
    },
  })
}
