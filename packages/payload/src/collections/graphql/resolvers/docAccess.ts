import type { CollectionPermission, GlobalPermission } from '../../../auth'
import type { PayloadRequest } from '../../../types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
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
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    })
  }

  return resolver
}
