import type { CollectionPermission, GlobalPermission } from '../../../auth'
import type { PayloadRequest } from '../../../types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { docAccessOperation } from '../../operations/docAccess'

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
