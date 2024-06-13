import type { CollectionPermission, GlobalPermission } from 'payload'
import type { PayloadRequestWithData, SanitizedGlobalConfig } from 'payload'

import { docAccessOperationGlobal } from 'payload'
import { isolateObjectProperty } from 'payload'

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
