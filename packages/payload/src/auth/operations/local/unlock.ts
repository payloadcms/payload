import type { PayloadT, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { unlockOperation } from '../unlock'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    email
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localUnlock<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<boolean> {
  const {
    collection: collectionSlug,
    context,
    data,
    overrideAccess = true,
    req = {} as PayloadRequest,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Unlock Operation.`,
    )
  }

  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  req.payload = payload
  req.payloadAPI = req.payloadAPI || 'local'
  req.i18n = i18n
  req.t = i18n.t

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return unlockOperation({
    collection,
    data,
    overrideAccess,
    req,
  })
}

export default localUnlock
