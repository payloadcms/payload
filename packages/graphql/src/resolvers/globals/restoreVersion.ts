import type { GraphQLResolveInfo } from 'graphql'
import type { Document, PayloadRequest, SanitizedGlobalConfig } from 'payload'

import { restoreVersionOperationGlobal } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

type Resolver = (
  _: unknown,
  args: {
    branch?: string
    draft?: boolean
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
  info: GraphQLResolveInfo,
) => Promise<Document>
export function restoreVersion(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      context,
      globalSlug: globalConfig.slug,
      info,
    })
    const options = {
      id: args.id,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req,
    }

    const result = await restoreVersionOperationGlobal(options)
    return result
  }
}
