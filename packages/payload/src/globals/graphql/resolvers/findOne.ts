/* eslint-disable no-param-reassign */

import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findOne from '../../operations/findOne'

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
  return async function resolver(_, args, context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
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
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty(req, 'transactionID'),
    }

    const result = await findOne(options)
    return result
  }
}
