import type { Document, PayloadRequestWithData, SanitizedGlobalConfig } from 'payload'

import { isolateObjectProperty, restoreVersionOperationGlobal } from 'payload'

import type { Context } from '../types.js'

type Resolver = (
  _: unknown,
  args: {
    id: number | string
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<Document>
export default function restoreVersionResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context) {
    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperationGlobal(options)
    return result
  }
}
