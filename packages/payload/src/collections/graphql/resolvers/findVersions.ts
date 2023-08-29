/* eslint-disable no-param-reassign */

import type { Response } from 'express'

import type { PaginatedDocs } from '../../../database/types.js'
import type { PayloadRequest } from '../../../express/types.js'
import type { Where } from '../../../types/index.js'
import type { Collection } from '../../config/types.js'

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
) => Promise<PaginatedDocs<any>>

export default function findVersionsResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      collection,
      depth: 0,
      limit: args.limit,
      page: args.page,
      req: context.req,
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersions(options)

    return result
  }

  return resolver
}
