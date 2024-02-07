import { deleteByIDOperation } from 'payload/operations'
import type { GeneratedTypes } from 'payload'
import type { PayloadRequest } from 'payload/types'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

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
  async function resolver(_, args, context: Context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: isolateTransactionID(context.req),
    }

    const result = await deleteByIDOperation(options)

    return result
  }

  return resolver
}
