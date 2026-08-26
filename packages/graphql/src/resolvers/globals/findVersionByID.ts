import type { GraphQLResolveInfo } from 'graphql'
import type { Document, SanitizedGlobalConfig } from 'payload'

import { findVersionByIDOperationGlobal, isolateObjectProperty, resetBranchState } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
    draft?: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
    select?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<Document>

export function findVersionByID(globalConfig: SanitizedGlobalConfig): Resolver {
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
