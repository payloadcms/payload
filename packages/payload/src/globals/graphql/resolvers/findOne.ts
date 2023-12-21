/* eslint-disable no-param-reassign */

import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findOne from '../../operations/findOne'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findOneOperation } from '../../operations/findOne'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const { slug } = globalConfig

    const options = {
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty(context.req, 'transactionID'),
      slug,
    }

    const result = await findOneOperation(options)
    return result
  }
}
