import type { Response } from 'express'

import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { GeneratedTypes } from '../../../index'
import type { Payload } from '../../../payload'
import type { Result } from '../login'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import login from '../login'

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  context?: RequestContext
  data: {
    email: string
    password: string
  }
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  res?: Response
  showHiddenFields?: boolean
}

async function localLogin<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
  const {
    collection: collectionSlug,
    data,
    depth,
    overrideAccess = true,
    res,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Login Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  const args = {
    collection,
    data,
    depth,
    overrideAccess,
    req,
    res,
    showHiddenFields,
  }

  return login<TSlug>(args)
}

export default localLogin
