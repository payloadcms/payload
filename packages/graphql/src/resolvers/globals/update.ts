import type { GeneratedTypes } from 'payload'
import type { PayloadRequest, PayloadRequestWithData, SanitizedGlobalConfig } from 'payload/types'
import type { DeepPartial } from 'ts-essentials'

import { updateOperationGlobal } from 'payload/operations'
import { isolateObjectProperty } from 'payload/utilities'

import type { Context } from '../types.js'

type Resolver<TSlug extends keyof GeneratedTypes['globals']> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
    draft?: boolean
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<GeneratedTypes['globals'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['globals']>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty<PayloadRequest>(req, 'locale')
    req = isolateObjectProperty<PayloadRequest>(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) req.query = {}

    const draft: boolean =
      args.draft ?? req.query?.draft === 'false'
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') req.query.draft = String(draft)

    context.req = req

    const options = {
      slug: globalConfig.slug,
      data: args.data,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await updateOperationGlobal<TSlug>(options)
    return result
  }
}
