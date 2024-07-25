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
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) req.query = {}

    const draft: boolean =
      args.draft ?? req.query?.draft === 'false'
        ? false
        : req.query?.draft === 'true'
        ? true
        : undefined
    if (typeof draft === 'boolean') req.query.draft = String(draft)

    context.req = req

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
