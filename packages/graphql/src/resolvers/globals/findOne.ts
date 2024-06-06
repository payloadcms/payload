import type { PayloadRequest } from 'payload/types'

import { findOneOperation } from 'payload/operations'
import { type Document, type SanitizedGlobalConfig } from 'payload/types'
import { isolateObjectProperty } from 'payload/utilities'

import type { Context } from '../types.js'

export default function findOneResolver(globalConfig: SanitizedGlobalConfig): Document {
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
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await findOneOperation(options)
    return result
  }
}
