/* eslint-disable no-param-reassign */
import type { Response } from 'express'

import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Collection } from '../../config/types'

import deleteByID from '../../operations/deleteByID'

export type Resolver<TSlug extends keyof GeneratedTypes['collections']> = (
  _: unknown,
  args: {
    fallbackLocale?: string
    locale?: string
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<GeneratedTypes['collections'][TSlug]>

export default function getDeleteResolver<TSlug extends keyof GeneratedTypes['collections']>(
  collection: Collection,
): Resolver<TSlug> {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req: context.req,
    }

    const result = await deleteByID(options)

    return result
  }

  return resolver
}
