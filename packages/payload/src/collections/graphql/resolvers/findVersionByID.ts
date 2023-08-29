/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { PayloadRequest } from '../../../express/types.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { Collection, TypeWithID } from '../../config/types.js'

import findVersionByID from '../../operations/findVersionByID.js'

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
      collection,
      depth: 0,
      draft: args.draft,
      id: args.id,
      req: context.req,
    }

    const result = await findVersionByID(options)

    return result
  }
}
