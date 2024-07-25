/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { PayloadRequest } from '../../../express/types'
import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
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
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale

    context.req = req

    const options = {
      id: args.id,
      depth: 0,
      globalConfig,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await findVersionByID(options)
    return result
  }
}
