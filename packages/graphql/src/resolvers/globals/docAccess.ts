import type {
  PayloadRequest,
  SanitizedCollectionPermission,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export type Resolver = (
  _: unknown,
  context: {
    req: PayloadRequest
  },
) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, context: Context) {
    const req = isolateObjectProperty(context.req, 'transactionID')
    return invokeGraphQLOperation(req, 'global', 'docAccess', {
      global: global.slug,
      req,
    })
  }

  return resolver
}
