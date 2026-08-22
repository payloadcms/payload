import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, TypeWithID, TypeWithVersion } from 'payload'

import { findVersionByIDOperation, isolateObjectProperty, resetBranchState } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver<T extends TypeWithID = any> = (
  _: unknown,
  args: {
    branch?: string
    fallbackLocale?: string
    id: number | string
    locale?: string
    select?: boolean
    trash?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TypeWithVersion<T>>

export function findVersionByIDResolver(collection: Collection): Resolver {
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

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req,
      select,
      trash: args.trash,
    }

    const result = await findVersionByIDOperation(options)
    return result
  }
}
