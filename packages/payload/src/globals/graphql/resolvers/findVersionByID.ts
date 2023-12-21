/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'
import type { SanitizedGlobalConfig } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findVersionByID from '../../operations/findVersionByID'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findVersionByIDOperation } from '../../operations/findVersionByID'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

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
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await findVersionByIDOperation(options)
    return result
  }
}
