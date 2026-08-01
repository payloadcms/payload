import type {
  Collection,
  PayloadRequest,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>

export function docAccessResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    const req = isolateObjectProperty(context.req, 'transactionID')
    return invokeGraphQLOperation(req, 'collection', 'docAccess', {
      id: args.id,
      collection: collection.config.slug,
      req,
    })
  }

  return resolver
}
