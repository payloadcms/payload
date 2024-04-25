import type { CollectionPermission, GlobalPermission } from 'payload/auth'
import type { PayloadRequestWithData, SanitizedGlobalConfig } from 'payload/types'

import { docAccessOperationGlobal } from 'payload/operations'
import { isolateObjectProperty } from 'payload/utilities'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequestWithData
  },
) => Promise<CollectionPermission | GlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context: Context) {
    return docAccessOperationGlobal({
      globalConfig: global,
      req: isolateObjectProperty(context.req, 'transactionID'),
    })
  }

  return resolver
}
