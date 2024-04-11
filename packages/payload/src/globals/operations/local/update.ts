import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes, Payload, RequestContext } from '../../../index.js'
import type { Document, PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { updateOperation } from '../update.js'

export type Options<TSlug extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  data: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
  depth?: number
  draft?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  locale?: GeneratedTypes['locale']
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

  return updateOperation<TSlug>({
    slug: globalSlug as string,
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  })
}
