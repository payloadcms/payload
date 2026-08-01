import type { DataFromGlobalSlug, GlobalSlug, PayloadRequest, SanitizedGlobalConfig } from 'payload'
import type { DeepPartial } from 'ts-essentials'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

type Resolver<TSlug extends GlobalSlug> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
    draft?: boolean
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<DataFromGlobalSlug<TSlug>>

export function update<TSlug extends GlobalSlug>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale
    }
    if (args.fallbackLocale) {
      context.req.fallbackLocale = args.fallbackLocale
    }

    const { slug } = globalConfig

    const req = isolateObjectProperty(context.req, 'transactionID')
    const options = {
      slug,
      data: args.data,
      depth: 0,
      draft: args.draft,
      overrideAccess: false,
      req,
    }

    const result = await invokeGraphQLOperation(req, 'global', 'update', options)
    return result
  }
}
