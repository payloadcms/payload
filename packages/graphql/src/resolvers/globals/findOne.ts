import type { GraphQLResolveInfo } from 'graphql'
import type { Document, DocumentVersion, SanitizedGlobalConfig } from 'payload'

import { findOneOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { rememberDocumentVersion } from '../../utilities/documentVersion.js'
import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver = (
  _: unknown,
  args: {
    fallbackLocale?: string
    id: number | string
    locale?: string
    select?: boolean
    version?: DocumentVersion
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<Document>

export function findOne(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context, info) {
    const req = (context.req = isolateObjectProperty(context.req, [
      'locale',
      'fallbackLocale',
      'transactionID',
    ]))
    const select = (context.select = args.select
      ? buildSelectForCollection(info, context)
      : undefined)
    const { slug } = globalConfig

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
    context.req.query = {
      ...context.req.query,
      version: args.version ?? context.req.query?.version,
    }

    const options = {
      slug,
      depth: 0,
      globalConfig,
      req,
      select,
      version: args.version,
    }

    const result = await findOneOperation(options)
    return rememberDocumentVersion({ data: result, version: args.version ?? 'published' })
  }
}
