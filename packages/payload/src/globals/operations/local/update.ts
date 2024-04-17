import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes, RequestContext } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import update from '../update'

export type Options<TSlug extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  data: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function updateLocal<TSlug extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const { slug: globalSlug, data, depth, draft, overrideAccess = true, showHiddenFields } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const req = createLocalReq(options, payload)

  return update<TSlug>({
    slug: globalSlug as string,
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
