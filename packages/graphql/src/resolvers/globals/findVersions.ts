import type { Document, PayloadRequestWithData, SanitizedGlobalConfig, Where } from 'payload'

import { findVersionsOperationGlobal, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    sort?: string
    where: Where
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<Document>

export default function findVersionsResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context) {
    const options = {
      depth: 0,
      globalConfig,
      limit: args.limit,
      page: args.page,
      req: isolateObjectProperty(context.req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperationGlobal(options)

    return result
  }
}
