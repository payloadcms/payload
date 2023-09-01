import type { Config as GeneratedTypes } from 'payload/generated-types'

import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import unlock from '../unlock'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  data: {
    email
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localUnlock<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<boolean> {
  const {
    collection: collectionSlug,
    data,
    overrideAccess = true,
    req = {} as PayloadRequest,
  } = options
  setRequestContext(options.req)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Unlock Operation.`,
    )
  }

  req.payload = payload
  req.payloadAPI = req.payloadAPI || 'local'
  req.i18n = i18nInit(payload.config.i18n)

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return unlock({
    collection,
    data,
    overrideAccess,
    req,
  })
}

export default localUnlock
