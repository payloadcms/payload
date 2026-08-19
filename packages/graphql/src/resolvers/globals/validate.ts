import type {
  DataFromGlobalSlug,
  GlobalSlug,
  PayloadRequest,
  SanitizedGlobalConfig,
  ValidationResult,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import type { Context } from '../types.js'

export type Resolver<TSlug extends GlobalSlug> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
    draft?: boolean
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<ValidationResult>

/**
 * Validates a single locale — the request's resolved locale, or the `locale` argument when
 * provided. Unlike the Local and REST APIs, this does not support validating multiple locales or
 * `locale: 'all'` in one call.
 */
export function validateResolver<TSlug extends GlobalSlug>(
  globalConfig: SanitizedGlobalConfig,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    const { req } = context
    const locale = req.payload.config.localization ? args.locale || req.locale : null

    return req.payload.validateGlobal({
      slug: globalConfig.slug as TSlug,
      data: args.data,
      draft: args.draft,
      locale,
      overrideAccess: false,
      req,
    })
  }
}
