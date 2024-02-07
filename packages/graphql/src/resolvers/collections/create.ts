import { createOperation } from 'payload/operations'
import type { MarkOptional } from 'ts-essentials'
import type { GeneratedTypes } from 'payload'
import type { PayloadRequest } from 'payload/types'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (
  _: unknown,
  args: {
    data: MarkOptional<
      GeneratedTypes['collections'][TSlug],
      'createdAt' | 'id' | 'sizes' | 'updatedAt'
    >
    draft: boolean
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function createResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale
    }

    const options = {
      collection,
      data: args.data,
      depth: 0,
      draft: args.draft,
      req: isolateTransactionID(context.req),
    }

    const result = await createOperation(options)

    return result
  }
}
