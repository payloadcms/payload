import { restoreVersionOperationGlobal } from 'payload/operations'
import type { Document, PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import isolateObjectProperty from '../../utilities/isolateObjectProperty'

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
  return async function resolver(_, args, context) {
    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperationGlobal(options)
    return result
  }
}
