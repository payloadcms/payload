import { docAccessOperationGlobal } from 'payload/operations'
import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'
import type { CollectionPermission, GlobalPermission } from 'payload/auth'

import isolateTransactionID from '../../utilities/isolateTransactionID'

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest
  },
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context) {
    return docAccessOperationGlobal({
      globalConfig: global,
      req: isolateTransactionID(context.req),
    })
  }

  return resolver
}
