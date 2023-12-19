/* eslint-disable no-param-reassign */

import type { Response } from 'express'

import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest } from '../../../express/types'
import type { Where } from '../../../types'
import type { Collection } from '../../config/types'

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
) => Promise<PaginatedDocs<any>>

export default function findVersionsResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    let { req } = context
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    if (args.locale) req.locale = args.locale
    if (args.fallbackLocale) req.fallbackLocale = args.fallbackLocale

    const options = {
      collection,
      depth: 0,
      limit: args.limit,
      page: args.page,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersions(options)

    return result
  }

  return resolver
}
