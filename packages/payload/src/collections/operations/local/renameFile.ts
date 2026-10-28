import type {
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  RequestContext,
  TypedLocale,
  User,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createPayloadRequest } from '../../../utilities/createPayloadRequest.js'
import { renameFileOperation } from '../renameFile.js'

export type RenameFileOptions<TSlug extends CollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  filename: string
  id: number | string
  locale?: string
  overrideAccess?: boolean
  req?: Partial<PayloadRequest>
  user?: null | User
}

export const renameFileLocal = async <TSlug extends CollectionSlug>(
  payload: Payload,
  options: RenameFileOptions<TSlug>,
): Promise<DataFromCollectionSlug<TSlug>> => {
  const collection = payload.collections[options.collection]

  if (!collection) {
    throw new APIError(`The collection with slug ${String(options.collection)} can't be found.`)
  }

  return renameFileOperation({
    id: options.id,
    collection,
    depth: options.depth,
    draft: options.draft,
    filename: options.filename,
    overrideAccess: options.overrideAccess ?? false,
    req: await createPayloadRequest({
      context: options.context,
      depth: options.depth,
      fallbackLocale: options.fallbackLocale,
      locale: options.locale,
      payload,
      req: options.req,
      user: options.user ?? undefined,
    }),
  }) as Promise<DataFromCollectionSlug<TSlug>>
}
