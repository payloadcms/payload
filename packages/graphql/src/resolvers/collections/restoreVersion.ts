import { restoreVersionOperation } from 'payload/operations'
import type { PayloadRequest } from 'payload/types'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

export type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>

export default function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context) {
    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateTransactionID(context.req),
    }

    const result = await restoreVersionOperation(options)
    return result
  }

  return resolver
}
