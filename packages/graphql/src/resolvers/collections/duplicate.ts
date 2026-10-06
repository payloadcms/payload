import type {
  Collection,
  CollectionSlug,
  DataFromCollectionSlug,
  DocumentVersion,
  PayloadRequest,
} from 'payload'

import { duplicateOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { rememberDocumentVersion } from '../../utilities/documentVersion.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    data: TData
    fallbackLocale?: string
    id: string
    locale?: string
    version?: Exclude<DocumentVersion, 'latest'>
  },
  context: {
    req: PayloadRequest
  },
) => Promise<TData>

export function duplicateResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context: Context) {
    const { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    context.req = req

    context.req.query = {
      ...context.req.query,
      version: args.version ?? (collection.config.versions?.drafts ? 'draft' : 'published'),
    }

    const result = await duplicateOperation({
      id: args.id,
      collection,
      data: args.data,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
      version: args.version,
    })

    return rememberDocumentVersion({
      data: result,
      version: args.version ?? (collection.config.versions?.drafts ? 'draft' : 'published'),
    })
  }
}
