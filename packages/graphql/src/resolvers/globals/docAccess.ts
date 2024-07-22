import type {
  CollectionPermission,
  GlobalPermission,
  PayloadRequest,
  SanitizedGlobalConfig,
} from 'payload'

import { docAccessOperationGlobal, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest
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
