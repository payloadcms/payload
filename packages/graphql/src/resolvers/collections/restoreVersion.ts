import type { Collection, PayloadRequest, RestoreAction } from 'payload'

import { isolateObjectProperty, restoreVersionOperation } from 'payload'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    action?: RestoreAction
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>

export function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    const options = {
      id: args.id,
      action: args.action,
      collection,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperation(options)
    return result
  }

  return resolver
}
