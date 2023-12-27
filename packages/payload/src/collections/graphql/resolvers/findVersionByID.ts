import type { PayloadRequest } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'
import type { Collection, TypeWithID } from '../../config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findVersionByIDOperation } from '../../operations/findVersionByID'

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

    const result = await findVersionByIDOperation(options)

    return result
  }
}
