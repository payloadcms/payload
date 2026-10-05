import type {
  DataFromGlobalSlug,
  DocumentVersion,
  GlobalSlug,
  PayloadRequest,
  SanitizedGlobalConfig,
  SelectType,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import { isolateObjectProperty, updateOperationGlobal } from 'payload'

import type { Context } from '../types.js'

import { rememberDocumentVersion } from '../../utilities/documentVersion.js'

type Resolver<TSlug extends GlobalSlug> = (
  _: unknown,
  args: {
    data?: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
    fallbackLocale?: string
    locale?: string
    version?: DocumentVersion
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

    context.req.query = {
      ...context.req.query,
      version: args.version ?? (globalConfig.versions?.drafts ? 'draft' : 'published'),
    }

    const options = {
      slug,
      data: args.data,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
      version: args.version,
    }

    const result = await updateOperationGlobal<TSlug, SelectType>(options)
    return rememberDocumentVersion({
      data: result,
      version: args.version ?? (globalConfig.versions?.drafts ? 'draft' : 'published'),
    })
  }
}
