import type { Document, PayloadRequest, SanitizedGlobalConfig } from '@ruya.sa/payload'

import { isolateObjectProperty, restoreVersionOperationGlobal } from '@ruya.sa/payload'

import type { Context } from '../types.js'

type Resolver = (
  _: unknown,
  args: {
    draft?: boolean
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
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await restoreVersionOperationGlobal(options)
    return result
  }
}
