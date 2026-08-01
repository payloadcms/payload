import type { Collection } from '../../collections/config/types.js'
import type { Payload } from '../../index.js'

import { APIError } from '../../errors/APIError.js'

export const getAuthCollection = (payload: Payload, slug: string): Collection => {
  const collection = payload.collections[slug]

  if (!collection?.config.auth) {
    throw new APIError(`The auth collection with slug ${slug} can't be found.`)
  }

  return collection
}
