import type { GeneratedTypes, Payload, RequestContext } from '../../../index.js'
import type { Document, PayloadRequestWithData } from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionByIDOperation } from '../findVersionByID.js'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  id: string
  locale?: 'all' | GeneratedTypes['locale']
  overrideAccess?: boolean
  req?: PayloadRequestWithData
  showHiddenFields?: boolean
  slug: T
  user?: Document
}

// eslint-disable-next-line no-restricted-exports
export default async function findVersionByIDLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<TypeWithVersion<GeneratedTypes['globals'][T]>> {
  const {
    id,
    slug: globalSlug,
    depth,
    disableErrors = false,
    overrideAccess = true,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findVersionByIDOperation({
    id,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  })
}
