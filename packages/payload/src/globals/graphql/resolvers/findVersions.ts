import type { Response } from 'express'

import type { PayloadRequest } from '../../../express/types'
import type { Document, Where } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findVersions from '../../operations/findVersions'

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
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersions(options)

    return result
  }
}
