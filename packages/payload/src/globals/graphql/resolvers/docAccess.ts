import type { CollectionPermission, GlobalPermission } from '../../../auth'
import type { PayloadRequest } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { docAccessOperation } from '../../operations/docAccess'

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
      req: isolateTransactionID(context.req),
    })
  }

  return resolver
}
