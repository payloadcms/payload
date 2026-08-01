import type { Collection, PayloadRequest } from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export type Resolver = (
  _: unknown,
  args: {
    draft?: boolean
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>

export function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    const req = isolateObjectProperty(context.req, 'transactionID')
    const options = {
      id: args.id,
      collection: collection.config.slug,
      depth: 0,
      draft: args.draft,
      overrideAccess: false,
      req,
    }

    const result = await invokeGraphQLOperation(req, 'collection', 'restoreVersion', options)
    return result
  }

  return resolver
}
