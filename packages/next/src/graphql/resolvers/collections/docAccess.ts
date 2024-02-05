import { docAccessOperation } from 'payload/operations'
import type { PayloadRequest } from 'payload/types'
import type { CollectionPermission, GlobalPermission } from 'payload/auth'

import isolateTransactionID from '../../utilities/isolateTransactionID'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(): Resolver {
  async function resolver(_, args, context) {
    return docAccessOperation({
      id: args.id,
      req: isolateTransactionID(context.req),
    })
  }

  return resolver
}
