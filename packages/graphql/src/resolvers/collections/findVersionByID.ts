import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, TypeWithID, TypeWithVersion } from 'payload'

import { findVersionByIDOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver<T extends TypeWithID = any> = (
  _: unknown,
  args: {
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
    const req = context.req = isolateObjectProperty(context.req, ['locale', 'fallbackLocale', 'transactionID'])
    const select = context.select = args.select ? buildSelectForCollection(info) : undefined

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
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
