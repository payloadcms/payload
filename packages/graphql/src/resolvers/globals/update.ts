import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadRequest,
  SanitizedGlobalConfig,
  SelectType,
  UpdateAction,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import { isolateObjectProperty, updateOperationGlobal } from 'payload'

import type { Context } from '../types.js'

type Resolver<TSlug extends GlobalSlug> = (
  _: unknown,
  args: {
    action?: UpdateAction
    data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
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
    const localization = context.req.payload.config.localization
    const returningLocale =
      args.locale === 'all'
        ? context.req.locale !== 'all' && context.req.locale
          ? context.req.locale
          : localization
            ? localization.defaultLocale
            : undefined
        : undefined

    if (args.locale) {
      context.req.locale = args.locale
    }
    if (args.fallbackLocale) {
      context.req.fallbackLocale = args.fallbackLocale
    }

    const { slug } = globalConfig

    const options = {
      slug,
      action: args.action,
      data: args.data,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
      returningLocale,
    }

    const result = await updateOperationGlobal<TSlug, SelectType>(options)
    return result
  }
}
