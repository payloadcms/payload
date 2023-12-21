import type { CollectionPermission, GlobalPermission } from '../../../auth'
import type { PayloadRequest } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { docAccess } from '../../operations/docAccess'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { docAccessOperation } from '../../operations/docAccess'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context) {
    return docAccessOperation({
      globalConfig: global,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    })
  }

  return resolver
}
