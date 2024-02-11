import type { GeneratedTypes, RequestContext } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import findVersionByID from '../findVersionByID'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: T
  user?: Document
}

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

  const req = createLocalReq(options, payload)

  return findVersionByID({
    id,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
