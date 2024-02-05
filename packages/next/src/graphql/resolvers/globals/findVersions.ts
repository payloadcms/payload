import { findVersionsOperationGlobal } from 'payload/operations'
import type { Document, PayloadRequest, SanitizedGlobalConfig, Where } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

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
    req: PayloadRequest
  },
) => Promise<Document>

export default function findVersionsResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      depth: 0,
      globalConfig,
      limit: args.limit,
      page: args.page,
      req: isolateTransactionID(context.req),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperationGlobal(options)

    return result
  }
}
