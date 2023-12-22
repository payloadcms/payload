import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { findOneOperation } from '../../operations/findOne'

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const { slug } = globalConfig

    const options = {
      slug,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await findOneOperation(options)
    return result
  }
}
