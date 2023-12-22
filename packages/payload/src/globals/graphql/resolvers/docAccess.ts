import type { CollectionPermission, GlobalPermission } from '../../../auth'
import type { PayloadRequest } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { docAccessOperation } from '../../operations/docAccess'

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest
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
