import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Collection } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import findByID from '../../operations/findByID'

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
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
    }

    const result = await findByID(options)

    return result
  }
}
