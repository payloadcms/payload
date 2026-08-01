import type { Document, PayloadRequest, SanitizedGlobalConfig } from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

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
    const req = isolateObjectProperty(context.req, 'transactionID')
    const options = {
      id: args.id,
      slug: globalConfig.slug,
      depth: 0,
      draft: args.draft,
      overrideAccess: false,
      req,
    }

    const result = await invokeGraphQLOperation(req, 'global', 'restoreVersion', options)
    return result
  }
}
