import type { GraphQLResolveInfo } from 'graphql'
import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadRequest,
  SanitizedGlobalConfig,
  SelectType,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import { updateOperationGlobal } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

type Resolver<TSlug extends GlobalSlug> = (
  _: unknown,
  args: {
    branch?: string
    data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
    draft?: boolean
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
  info: GraphQLResolveInfo,
) => Promise<DataFromGlobalSlug<TSlug>>

export function update<TSlug extends GlobalSlug>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context, info) {
    const { slug } = globalConfig
    const req = await getGraphQLRequest({
      branch: args.branch,
      context,
      fallbackLocale: args.fallbackLocale,
      globalSlug: slug,
      info,
      locale: args.locale,
    })

    const options = {
      slug,
      data: args.data,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req,
    }

    const result = await updateOperationGlobal<TSlug, SelectType>(options)
    return result
  }
}
