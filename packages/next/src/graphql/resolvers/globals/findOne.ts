import { findOneOperation } from 'payload/operations'
import type { Document, SanitizedGlobalConfig } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const { slug } = globalConfig

    const options = {
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateTransactionID(context.req),
      slug,
    }

    const result = await findOneOperation(options)
    return result
  }
}
