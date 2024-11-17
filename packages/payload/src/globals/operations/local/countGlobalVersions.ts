import type { GlobalSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, Where } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { countGlobalVersionsOperation } from '../countGlobalVersions.js'

export type CountGlobalVersionsOptions<TSlug extends GlobalSlug> = {
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  global: TSlug
  locale?: TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  user?: Document
  where?: Where
}

// eslint-disable-next-line no-restricted-exports
export default async function countGlobalVersionsLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: CountGlobalVersionsOptions<TSlug>,
): Promise<{ totalDocs: number }> {
  const { disableErrors, global: globalSlug, overrideAccess = true, where } = options

  const global = payload.globals.config.find(({ slug }) => slug === globalSlug)

  if (!global) {
    throw new APIError(
      `The global with slug ${String(globalSlug)} can't be found. Count Global Versions Operation.`,
    )
  }

  return countGlobalVersionsOperation<TSlug>({
    disableErrors,
    global,
    overrideAccess,
    req: await createLocalReq(options, payload),
    where,
  })
}
