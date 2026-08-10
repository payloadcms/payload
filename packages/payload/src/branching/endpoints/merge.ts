import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { Forbidden, NotFound } from '../../errors/index.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { mergeBranch } from '../merge.js'
import { branchesCollectionSlug } from '../types.js'

/**
 * `POST /<branches>/:id/merge`
 *
 * Runs with `overrideAccess: false` and the authenticated user, so the
 * per-document preflight applies. This is the boundary at which branching's
 * access model is actually enforced — the Local API, like every other Payload
 * operation, trusts server-side callers by default.
 */
export const mergeBranchHandler: PayloadHandler = async (req) => {
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

  const body = (req.data ?? {}) as {
    changes?: (number | string)[]
    dryRun?: boolean
  }

  const result = await mergeBranch(payload, {
    branch: branchDoc.slug as string,
    changes: body.changes,
    dryRun: Boolean(body.dryRun),
    overrideAccess: false,
    req,
  })

  // Nothing could be applied and something was refused: report it as a refusal
  // rather than an empty success, so a programmatic caller sees the same
  // per-document reasons the admin UI would show.
  const status = !result.canMerge && result.blocked.length ? httpStatus.FORBIDDEN : httpStatus.OK

  return Response.json(result, {
    headers: headersWithCors({ headers: new Headers(), req }),
    status,
  })
}
