/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Collection } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import updateByID from '../../operations/updateByID'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { updateByIDOperation } from '../../operations/updateByID'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (
  _: unknown,
  args: {
    autosave: boolean
    data: GeneratedTypes['collections'][TSlug]
    draft: boolean
    id: number | string
    locale?: string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function updateResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  async function resolver(_, args, context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale

    const options = {
      id: args.id,
      autosave: args.autosave,
      collection,
      data: args.data,
      depth: 0,
      draft: args.draft,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await updateByIDOperation<TSlug>(options)

    return result
  }

  return resolver
}
