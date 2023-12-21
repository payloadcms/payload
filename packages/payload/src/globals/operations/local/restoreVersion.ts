import type { GeneratedTypes, PayloadT, RequestContext } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
<<<<<<< HEAD
import { createLocalReq } from '../../../utilities/createLocalReq'
import restoreVersion from '../restoreVersion'
=======
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { restoreVersionOperation } from '../restoreVersion'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: string
  user?: Document
}

export default async function restoreVersionLocal<T extends keyof GeneratedTypes['globals']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const { id, slug: globalSlug, depth, overrideAccess = true, showHiddenFields } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const req = createLocalReq(options, payload)

  return restoreVersionOperation({
    id,
    depth,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
