import { findVersionByIDOperation } from 'payload/operations'
import type { PayloadRequest } from 'payload/types'
import type { TypeWithVersion } from 'payload/versions'
import type { Collection, TypeWithID } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

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
  },
) => Promise<TypeWithVersion<T>>

export default function findVersionByIDResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context: Context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req: isolateTransactionID(context.req),
    }

    const result = await findVersionByIDOperation(options)

    return result
  }
}
