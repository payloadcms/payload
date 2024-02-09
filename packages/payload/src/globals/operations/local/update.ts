import type { DeepPartial } from 'ts-essentials'

import type { Payload, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import { updateOperation } from '../update'

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
  const { data, depth, draft, overrideAccess = true, showHiddenFields, slug: globalSlug } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return updateOperation<TSlug>({
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req: await createLocalReq(options, payload),
    showHiddenFields,
    slug: globalSlug as string,
  })
}
