import httpStatus from 'http-status'
import { extractJWT } from 'payload/auth'
import { findByIDOperation } from 'payload/operations'
import { isNumber } from 'payload/utilities'

import type { CollectionRouteHandlerWithID } from '../types.js'

import { routeError } from '../routeError.js'

export const preview: CollectionRouteHandlerWithID = async ({ id, collection, req }) => {
  const { searchParams } = req
  const depth = searchParams.get('depth')

  const result = await findByIDOperation({
    id,
    collection,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    req,
  })

  let previewURL: string

  const generatePreviewURL = req.payload.config.collections.find(
    (config) => config.slug === collection.config.slug,
  )?.admin?.preview

  const token = extractJWT(req)

  if (typeof generatePreviewURL === 'function') {
    try {
      previewURL = await generatePreviewURL(result, {
        locale: req.locale,
        req,
        token,
      })
    } catch (err) {
      routeError({
        collection,
        err,
        req,
      })
    }
  }

  return Response.json(previewURL, {
    status: httpStatus.OK,
  })
}
