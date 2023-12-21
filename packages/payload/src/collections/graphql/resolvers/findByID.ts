import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Collection } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findByID from '../../operations/findByID'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findByIDOperation } from '../../operations/findByID'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Resolver<T> = (
  _: unknown,
  args: {
    draft: boolean
    fallbackLocale?: string
    id: string
    locale?: string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<T>

export default function findByIDResolver<T extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<GeneratedTypes['collections'][T]> {
  return async function resolver(_, args, context) {
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
      draft: args.draft,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await findByIDOperation(options)

    return result
  }
}
