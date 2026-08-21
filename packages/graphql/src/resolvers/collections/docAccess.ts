import type {
  Collection,
  PayloadRequest,
  SanitizedCollectionPermission,
  SanitizedGlobalPermission,
} from 'payload'

import { isolateObjectProperty } from 'payload'
import { docAccessOperation } from 'payload/internal'

import type { Context } from '../types.js'

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
    return docAccessOperation({
      id: args.id,
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    })
  }

  return resolver
}
