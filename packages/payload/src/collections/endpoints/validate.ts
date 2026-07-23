import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import {
  getRequestCollection,
  getRequestCollectionWithID,
} from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import {
  assertValidationData,
  parseValidationLocaleSelector,
} from '../../utilities/parseValidationLocale.js'
import { validateLocal } from '../operations/local/validate.js'

/**
 * Validates collection create candidate data.
 *
 * `POST {routes.api}/{collection}/validate` requires an object body and one or more `locale` query
 * parameters, or `locale=all`. Field validation failures return a `200` ValidationResult.
 */
export const validateHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  const locale = parseValidationLocaleSelector(req.query.locale)

  assertValidationData(req.data)

  const result = await validateLocal(req.payload, {
    collection: collection.config.slug,
    data: req.data,
    locale,
    overrideAccess: false,
    req,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}

/**
 * Validates a stored collection document with optional partial candidate data.
 *
 * `POST {routes.api}/{collection}/{id}/validate` accepts an optional object body and requires one
 * or more `locale` query parameters, or `locale=all`. Field validation failures return a `200`
 * ValidationResult.
 */
export const validateByIDHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  const locale = parseValidationLocaleSelector(req.query.locale)

  if (req.data !== undefined) {
    assertValidationData(req.data)
  }

  const result = await validateLocal(req.payload, {
    id,
    collection: collection.config.slug,
    data: req.data,
    locale,
    overrideAccess: false,
    req,
  })

  return Response.json(result, {
    headers: headersWithCors({
      headers: new Headers(),
      req,
    }),
    status: httpStatus.OK,
  })
}
