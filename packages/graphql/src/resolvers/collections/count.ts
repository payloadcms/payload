import type { Collection, PayloadRequest, Where } from 'payload'

import { countOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    data: Record<string, unknown>
    locale?: string
    where?: Where
  },
  context: {
    req: PayloadRequest
  },
) => Promise<{ totalDocs: number }>

export function countResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context: Context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = fallbackLocale
    context.req = req

    const options = {
      collection,
      req: isolateObjectProperty(req, 'transactionID'),
      where: args.where,
    }

    const results = await countOperation(options)
    return results
  }
}
