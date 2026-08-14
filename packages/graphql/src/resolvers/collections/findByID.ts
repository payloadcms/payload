import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, CollectionSlug, DataFromCollectionSlug } from 'payload'

import { findByIDOperation, isolateObjectProperty, resetBranchState } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    branch?: string
    draft: boolean
    fallbackLocale?: string
    id: string
    locale?: string
    select?: boolean
    trash?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TData>

export function findByIDResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context, info) {
    const req = (context.req = isolateObjectProperty(context.req, [
      'branch',
      'context',
      'locale',
      'fallbackLocale',
      'transactionID',
    ]))
    const select = (context.select = args.select ? buildSelectForCollection(info) : undefined)

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale

    // Same shape as `locale`: an argument on the field, resolved onto the request the
    // operation reads. Branch state is memoized per request, so a field that names its own
    // branch gets its own copy of that state rather than the previous field's.
    if (args.branch && args.branch !== req.branch) {
      req.branch = args.branch
      req.context = { ...req.context }
      resetBranchState(req)
    }
    req.query = req.query || {}

    const draft: boolean =
      (args.draft ?? req.query?.draft === 'false')
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') {
      req.query.draft = String(draft)
    }

    const options = {
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req,
      select,
      trash: args.trash,
    }

    const result = await findByIDOperation(options)
    return result
  }
}
