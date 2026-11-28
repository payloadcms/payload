import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadRequest,
  SanitizedGlobalConfig,
  SelectType,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import { isolateObjectProperty, updateOperationGlobal } from 'payload'

import type { Context } from '../types.js'

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

/**
 * Creates a GraphQL resolver for updating a global document.
 *
 * @param globalConfig - The sanitized global configuration.
 * @returns A resolver function that updates the global document with the provided data.
 */
export function update<TSlug extends GlobalSlug>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  /**
   * Resolves the update mutation for a global document.
   *
   * @param _ - Unused root value.
   * @param args - The mutation arguments including optional data, draft, locale, and fallbackLocale.
   * @param context - The GraphQL context containing the request.
   * @returns The updated global document.
   */
  return async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale
    }
    if (args.fallbackLocale) {
      context.req.fallbackLocale = args.fallbackLocale
    }

    const { slug } = globalConfig

    const options = {
      slug,
      data: args.data ?? {},
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await updateOperationGlobal<TSlug, SelectType>(options)
    return result
  }
}
