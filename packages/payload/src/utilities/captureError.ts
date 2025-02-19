import type { Payload, PayloadRequest } from '../types/index.js'

import { type CollectionSlug, createLocalReq, logError } from '../index.js'

export const captureError = async ({
  collectionSlug,
  err,
  msg,
  ...reqOrPayload
}: {
  collectionSlug?: CollectionSlug
  err: unknown
  msg?: string
} & (
  | { payload: Payload }
  | {
      req: PayloadRequest
    }
)) => {
  let payload: Payload
  let req: PayloadRequest | undefined = undefined

  if ('req' in reqOrPayload) {
    payload = reqOrPayload.req.payload
    req = reqOrPayload.req
  } else {
    payload = reqOrPayload.payload
  }

  if (msg) {
    payload.logger.error(msg)
    logError({ err, payload })
  } else {
    logError({ err, payload })
  }

  if (Array.isArray(payload.config.hooks?.afterError)) {
    for (const hook of payload.config.hooks.afterError) {
      if (!req) {
        req = await createLocalReq({}, payload)
      }

      try {
        await hook({
          collection: collectionSlug ? req.payload.collections[collectionSlug]?.config : undefined,
          context: req.context,
          error: err as Error,
          message: msg,
          req,
        })
        // eslint-disable-next-line no-empty
      } catch {}
    }
  }
}
