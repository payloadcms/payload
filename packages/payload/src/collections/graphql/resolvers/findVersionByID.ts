/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { PayloadRequest } from '../../../express/types'
import type { TypeWithVersion } from '../../../versions/types'
import type { Collection, TypeWithID } from '../../config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import findVersionByID from '../../operations/findVersionByID'

export type Resolver<T extends TypeWithID = any> = (
  _: unknown,
  args: {
    draft: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<TypeWithVersion<T>>

export default function findVersionByIDResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req: isolateTransactionID(context.req),
    }

    const result = await findVersionByID(options)

    return result
  }
}
