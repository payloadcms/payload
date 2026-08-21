import type { Document, PayloadRequest, RestoreAction, SanitizedGlobalConfig } from 'payload'

import { isolateObjectProperty, restoreVersionOperationGlobal } from 'payload'

import type { Context } from '../types.js'

type Resolver = (
  _: unknown,
  args: {
    action?: RestoreAction
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<Document>
export function restoreVersion(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context) {
    const options = {
      id: args.id,
      action: args.action,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperationGlobal(options)
    return result
  }
}
