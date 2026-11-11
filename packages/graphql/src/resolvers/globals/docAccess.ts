import type { GraphQLResolveInfo } from 'graphql'
import type {
  SanitizedCollectionPermission,
  SanitizedGlobalConfig,
  SanitizedGlobalPermission,
} from 'payload'

import { docAccessOperationGlobal } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>

export function docAccessResolver(global: SanitizedGlobalConfig): Resolver {
  async function resolver(_, args, context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      context,
      globalSlug: global.slug,
      info,
    })

    return docAccessOperationGlobal({
      globalConfig: global,
      req,
    })
  }

  return resolver
}
