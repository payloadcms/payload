import type { GeneratedTypes, Payload, RequestContext } from '../../..'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../forgotPassword'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { forgotPasswordOperation } from '../forgotPassword'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  req?: PayloadRequest
}

async function localForgotPassword<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    context,
    data,
    disableEmail,
    expiration,
    req = {} as PayloadRequest,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Forgot Password Operation.`,
    )
  }

  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  req.payloadAPI = req.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return forgotPasswordOperation({
    collection,
    data,
    disableEmail,
    expiration,
    req,
  })
}

export default localForgotPassword
