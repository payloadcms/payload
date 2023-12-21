import type { CollectionPermission, GlobalPermission } from '../../../auth'
import type { PayloadRequest } from '../../../types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { docAccess } from '../../operations/docAccess'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { docAccessOperation } from '../../operations/docAccess'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
    res: Response
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
