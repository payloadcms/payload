import { findByIDOperation } from 'payload/operations'
import type { GeneratedTypes } from 'payload'
import type { PayloadRequest } from 'payload/types'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

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
  },
) => Promise<T>

export default function findByIDResolver<T extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<GeneratedTypes['collections'][T]> {
  return async function resolver(_, args, context: Context) {
    const { req } = context
    if (args.locale) req.locale = args.locale
    if (args.fallbackLocale) req.fallbackLocale = args.fallbackLocale

    const options = {
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req: isolateTransactionID(context.req),
    }

    const result = await findByIDOperation(options)

    return result
  }
}
