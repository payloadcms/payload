import type { GraphQLResolveInfo } from 'graphql'
import type { Document, SanitizedGlobalConfig } from 'payload'

import { findVersionByIDOperationGlobal, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver = (
  _: unknown,
  args: {
    draft?: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
    select?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Document>

export function findVersionByID(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context, info) {
    const req = context.req = isolateObjectProperty(context.req, ['locale', 'fallbackLocale', 'transactionID'])
    const select = context.select = args.select ? buildSelectForCollection(info) : undefined

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
    req.query = req.query || {}

    const options = {
      id: args.id,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req,
      select,
    }

    const result = await findVersionByIDOperationGlobal(options)
    return result
  }
}
