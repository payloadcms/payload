import { restoreVersionOperation } from 'payload/operations'
import type { PayloadRequest } from 'payload/types'
import type { Collection } from 'payload/types'

import isolateObjectProperty from '../../utilities/isolateObjectProperty'

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
  async function resolver(_, args, context) {
    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperation(options)
    return result
  }

  return resolver
}
