import type { Collection, PayloadRequest, TypeWithID, TypeWithVersion } from 'payload'

import { findVersionByIDOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver<T extends TypeWithID = any> = (
  _: unknown,
  args: {
    fallbackLocale?: string
    id: number | string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<TypeWithVersion<T>>

export function findVersionByIDResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context: Context) {
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
      collection,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
    }

    const result = await findVersionByIDOperation(options)

    return result
  }
}
