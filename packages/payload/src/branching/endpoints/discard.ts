import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { Forbidden, NotFound } from '../../errors/index.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { discardBranchChanges } from '../discard.js'
import { branchesCollectionSlug } from '../types.js'

/**
 * `POST /<branches>/:id/discard`
 *
 * Throws away pending changes, or the subset named in `changes`.
 *
 * No per-document preflight, unlike merge: discarding touches only the branch's own
 * rows and leaves `main` exactly as it was, so there is no production permission to
 * check. Reaching the branch still requires being able to read it, and a closed
 * branch refuses outright.
 */
export const discardBranchHandler: PayloadHandler = async (req) => {
  const { payload, routeParams } = req
  const id = routeParams?.id as number | string

  if (!req.user) {
    throw new Forbidden(req.t)
  }

  const branchDoc = await payload.findByID({
    id,
    collection: branchesCollectionSlug,
    disableErrors: true,
    overrideAccess: false,
    req,
  })

  if (!branchDoc) {
    throw new NotFound(req.t)
  }

  const body = (req.data ?? {}) as { changes?: (number | string)[] }

  const result = await discardBranchChanges(payload, {
    branch: branchDoc.slug as string,
    changes: body.changes,
    req,
  })

  return Response.json(result, {
    headers: headersWithCors({ headers: new Headers(), req }),
    status: httpStatus.OK,
  })
}
