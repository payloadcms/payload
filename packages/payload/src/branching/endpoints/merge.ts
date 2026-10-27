import type { PayloadHandler } from '../../config/types.js'
import type { MergeResult } from '../merge.js'
import type { MergeProgress } from '../types.js'

import { Forbidden, NotFound } from '../../errors/index.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { mergeBranch } from '../merge.js'
import { isolateBranchState } from '../resolveBranch.js'
import { branchesCollectionSlug } from '../types.js'

/**
 * One line of the streamed merge response.
 *
 * NDJSON rather than server-sent events: the client is a `fetch` reading a
 * `ReadableStream`, not an `EventSource`, so the framing SSE adds buys nothing —
 * and one JSON object per line is trivially parseable from a reader loop.
 */
export type MergeStreamEvent =
  | { message: string; type: 'error' }
  | { result: MergeResult; type: 'complete' }
  | ({ type: 'progress' } & MergeProgress)

/**
 * `POST /<branches>/:id/merge`
 *
 * Runs with `overrideAccess: false` and the authenticated user, so the
 * per-document preflight applies. This is the boundary at which branching's
 * access model is actually enforced. The Local API uses the same secure default;
 * trusted server-side callers must opt in to bypassing it.
 *
 * `stream: true` switches the response to NDJSON progress events. A merge walks
 * an arbitrary number of documents one at a time, so the admin panel needs to
 * report where it is; streaming the loop it already runs avoids inventing a job
 * and a polling endpoint to carry that state.
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
    closeBranch?: boolean
    dryRun?: boolean
    stream?: boolean
  }

  const branch = branchDoc.slug as string

  if (body.stream && !body.dryRun) {
    return streamMerge({
      branch,
      changes: body.changes,
      closeBranch: Boolean(body.closeBranch),
      req,
    })
  }

  const result = await mergeBranch(payload, {
    branch,
    changes: body.changes,
    closeBranch: Boolean(body.closeBranch),
    dryRun: Boolean(body.dryRun),
    overrideAccess: false,
    req,
  })

  // Nothing could be applied and something was refused: report it as a refusal
  // rather than an empty success, so a programmatic caller sees the same
  // per-document reasons the admin UI would show.
  const status = result.validationErrors.length
    ? httpStatus.UNPROCESSABLE_ENTITY
    : !result.canMerge && result.blocked.length
      ? httpStatus.FORBIDDEN
      : httpStatus.OK

  return Response.json(result, {
    headers: headersWithCors({ headers: new Headers(), req }),
    status,
  })
}

const streamMerge = ({
  branch,
  changes,
  closeBranch,
  req,
}: {
  branch: string
  changes?: (number | string)[]
  closeBranch: boolean
  req: Parameters<PayloadHandler>[0]
}): Response => {
  const { payload, user } = req
  const encoder = new TextEncoder()

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: MergeStreamEvent) =>
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))

      try {
        const mergeReq = isolateBranchState(req)

        delete mergeReq.transactionID

        const result = await mergeBranch(payload, {
          branch,
          changes,
          closeBranch,
          onProgress: (progress) => send({ type: 'progress', ...progress }),
          overrideAccess: false,
          req: mergeReq,
          user: user!,
        })

        send({ type: 'complete', result })
      } catch (err) {
        // The status line is long gone, so a failure has to be reported inside the
        // body. Clients treat a stream that ends without `complete` as failed too,
        // which covers a connection dropped mid-merge.
        payload.logger.error({ err, msg: `Streamed merge of branch "${branch}" failed` })

        send({
          type: 'error',
          message: err instanceof Error ? err.message : 'Unknown error',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: headersWithCors({
      headers: new Headers({
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type': 'application/x-ndjson; charset=utf-8',
      }),
      req,
    }),
    status: httpStatus.OK,
  })
}
