import type { PayloadRequest } from 'payload/types'

import { findVersionByIDOperationGlobal } from 'payload/operations'
import {
  type Document,
  type PayloadRequestWithData,
  type SanitizedGlobalConfig,
} from 'payload/types'
import { isolateObjectProperty } from 'payload/utilities'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    draft?: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<Document>

export default function findVersionByIDResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context: Context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty<PayloadRequest>(req, 'locale')
    req = isolateObjectProperty<PayloadRequest>(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale

    context.req = req

    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await findVersionByIDOperationGlobal(options)
    return result
  }
}
