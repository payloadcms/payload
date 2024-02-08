import type { GeneratedTypes, RequestContext } from '../../..'
import type { Payload } from '../../..'
import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import { findOneOperation } from '../findOne'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: T
  user?: Document
}

export default async function findOneLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const {
    depth,
    draft = false,
    overrideAccess = true,
    showHiddenFields,
    slug: globalSlug,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findOneOperation({
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
    slug: globalSlug as string,
  })
}
