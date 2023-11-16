/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { PayloadRequest } from '../../../express/types'
import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import findVersionByID from '../../operations/findVersionByID'

export type Resolver = (
  _: unknown,
  args: {
    draft?: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<Document>

export default function findVersionByIDResolver(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      id: args.id,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req: isolateTransactionID(context.req),
    }

    const result = await findVersionByID(options)
    return result
  }
}
