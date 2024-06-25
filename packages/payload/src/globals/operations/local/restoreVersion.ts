import type { GeneratedTypes, Payload, RequestContext } from '../../../index.js'
import type { Document, PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { restoreVersionOperation } from '../restoreVersion.js'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: GeneratedTypes['locale']
  id: string
  locale?: GeneratedTypes['locale']
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: string
  user?: Document
}

export default async function restoreVersionLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const { id, slug: globalSlug, depth, overrideAccess = true, showHiddenFields } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return restoreVersionOperation({
    id,
    depth,
    globalConfig,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  })
}
