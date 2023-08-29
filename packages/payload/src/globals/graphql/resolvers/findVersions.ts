import type { Response } from 'express'

import type { PayloadRequest } from '../../../express/types.js'
import type { Document, Where } from '../../../types/index.js'
import type { SanitizedGlobalConfig } from '../../config/types.js'

import findVersions from '../../operations/findVersions.js'

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
    res: Response
  },
) => Promise<Document>

export default function findVersionsResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    const options = {
      depth: 0,
      globalConfig,
      limit: args.limit,
      page: args.page,
      req: context.req,
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersions(options)

    return result
  }
}
