import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Collection } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { deleteByIDOperation } from '../../operations/deleteByID'

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (
  _: unknown,
  args: {
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function getDeleteResolver<TSlug extends keyof GeneratedTypes['collections']>(
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
      collection,
      depth: 0,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await deleteByIDOperation(options)

    return result
  }

  return resolver
}
