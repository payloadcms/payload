import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, TypeWithID, TypeWithVersion } from 'payload'

import { findVersionByIDOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { graphqlSelectFromCollection } from '../../utilities/graphqlSelect.js'

export type Resolver<T extends TypeWithID = any> = (
  _: unknown,
  args: {
    fallbackLocale?: string
    id: number | string
    locale?: string
    trash?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TypeWithVersion<T>>

export function findVersionByIDResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context, info) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale

    context.req = req

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
      select: graphqlSelectFromCollection(info),
      trash: args.trash,
    }

    const result = await findVersionByIDOperation(options)

    return result
  }
}
