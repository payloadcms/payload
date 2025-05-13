// @ts-strict-ignore
import type { Collection } from '../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/APIError.js'

export const getRequestCollection = (req: PayloadRequest): Collection => {
  const collectionSlug = req.routeParams.collection

  if (typeof collectionSlug !== 'string') {
    throw new APIError(`No collection was specified`, 400)
  }

  const collection = req.payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(`Collection with the slug ${collectionSlug} was not found`, 404)
  }

  return collection
}

export const getRequestCollectionWithID = <T extends boolean>(
  req: PayloadRequest,
  {
    disableSanitize,
    optionalID,
  }: {
    disableSanitize?: T
    optionalID?: boolean
  } = {},
): {
  collection: Collection
  id: T extends true ? string : number | string
} => {
  const collection = getRequestCollection(req)
  const id = req.routeParams.id

  if (typeof id !== 'string') {
    if (optionalID) {
      return {
        id: undefined,
        collection,
      }
    }

    throw new APIError(`ID was not specified`, 400)
  }

  if (disableSanitize === true) {
    return {
      id,
      collection,
    }
  }

  let sanitizedID: number | string = id

  // If default db ID type is a number, we should sanitize
  let shouldSanitize = Boolean(req.payload.db.defaultIDType === 'number')

  // UNLESS the customIDType for this collection is text.... then we leave it
  if (shouldSanitize && collection.customIDType === 'text') {
    shouldSanitize = false
  }

  // If we still should sanitize, parse float
  if (shouldSanitize) {
    sanitizedID = parseFloat(sanitizedID)
  }

  return {
    // @ts-expect-error generic return
    id: sanitizedID,
    collection,
  }
}

export const getRequestGlobal = (req: PayloadRequest): SanitizedGlobalConfig => {
  const globalSlug = req.routeParams.global

  if (typeof globalSlug !== 'string') {
    throw new APIError(`No global was specified`, 400)
  }

  const globalConfig = req.payload.globals.config.find((each) => each.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`Global with the slug ${globalSlug} was not found`, 404)
  }

  return globalConfig
}
