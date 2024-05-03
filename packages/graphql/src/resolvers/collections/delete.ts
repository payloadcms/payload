import type { GeneratedTypes } from 'payload'
import type { PayloadRequestWithData } from 'payload/types'
import type { Collection } from 'payload/types'

import { deleteByIDOperation } from 'payload/operations'
import { isolateObjectProperty } from 'payload/utilities'

import type { Context } from '../types.js'

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (
  _: unknown,
  args: {
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function getDeleteResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  async function resolver(_, args, context: Context) {
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

    const result = await deleteByIDOperation(options)

    return result
  }

  return resolver
}
