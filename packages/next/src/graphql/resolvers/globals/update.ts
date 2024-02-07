import { updateOperationGlobal } from 'payload/operations'
import type { DeepPartial } from 'ts-essentials'
import type { PayloadRequest, SanitizedGlobalConfig } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import type { GeneratedTypes } from 'payload'
import { Context } from '../types'

type Resolver<TSlug extends keyof GeneratedTypes['globals']> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
    draft?: boolean
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<GeneratedTypes['globals'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['globals']>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const { slug } = globalConfig

    const options = {
      data: args.data,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateTransactionID(context.req),
      slug,
    }

    const result = await updateOperationGlobal<TSlug>(options)
    return result
  }
}
