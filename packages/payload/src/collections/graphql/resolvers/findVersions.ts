/* eslint-disable no-param-reassign */

import type { Response } from 'express'

import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest } from '../../../types'
import type { Where } from '../../../types'
import type { Collection } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findVersions from '../../operations/findVersions'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findVersionsOperation } from '../../operations/findVersions'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

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
) => Promise<PaginatedDocs<any>>

export default function findVersionsResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale

    const options = {
      collection,
      depth: 0,
      limit: args.limit,
      page: args.page,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperation(options)

    return result
  }

  return resolver
}
