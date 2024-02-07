import { restoreVersionOperationGlobal } from 'payload/operations'
import type { Document, PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>
export default function restoreVersionResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context) {
    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateTransactionID(context.req),
    }

    const result = await restoreVersionOperationGlobal(options)
    return result
  }
}
