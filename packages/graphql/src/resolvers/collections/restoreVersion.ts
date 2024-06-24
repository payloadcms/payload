import type { Collection, PayloadRequestWithData } from 'payload'

import { isolateObjectProperty, restoreVersionOperation } from 'payload'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<Document>

export default function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperation(options)
    return result
  }

  return resolver
}
