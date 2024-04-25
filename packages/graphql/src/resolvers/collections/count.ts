import type { PayloadRequestWithData, Where } from 'payload/types'
import type { Collection } from 'payload/types'

import { countOperation } from 'payload/operations'
import { isolateObjectProperty } from 'payload/utilities'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    data: Record<string, unknown>
    locale?: string
    where?: Where
  },
  context: {
    req: PayloadRequestWithData
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<{ totalDocs: number }>

export default function countResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context: Context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = fallbackLocale

    const options = {
      collection,
      req: isolateObjectProperty(req, 'transactionID'),
      where: args.where,
    }

    const results = await countOperation(options)
    return results
  }
}
