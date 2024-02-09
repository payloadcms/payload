import { docAccessOperation } from 'payload/operations'
import type { Collection, PayloadRequest } from 'payload/types'
import type { CollectionPermission, GlobalPermission } from 'payload/auth'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    return docAccessOperation({
      id: args.id,
      req: isolateTransactionID(context.req),
      collection,
    })
  }

  return resolver
}
