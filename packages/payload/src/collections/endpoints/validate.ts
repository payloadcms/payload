import type { PayloadHandler } from '../../config/types.js'

import { unlinkTempFiles } from '../../uploads/unlinkTempFiles.js'
import {
  getRequestCollection,
  getRequestCollectionWithID,
} from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import {
  assertValidationData,
  parseValidationLocaleSelector,
} from '../../utilities/parseValidationLocale.js'
import { validateLocal } from '../operations/local/validate.js'

/**
 * Validates collection create candidate data.
 *
 * `POST {routes.api}/{collection}/validate` requires an object body. The optional `locale` query
 * parameter accepts one or more locales, or `locale=all`. Field validation failures return a
 * `200` ValidationResult.
 */
export const validateHandler: PayloadHandler = async (req) => {
  const collection = getRequestCollection(req)
  try {
    const locale =
      req.query.locale === undefined ? undefined : parseValidationLocaleSelector(req.query.locale)

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
      status: 200,
    })
  } finally {
    await unlinkTempFiles({
      collectionConfig: collection.config,
      config: req.payload.config,
      req,
    }).catch((err) => {
      req.payload.logger.error({ err, msg: 'Failed to remove temp file' })
    })
  }
}

/**
 * Validates a stored collection document with optional partial candidate data.
 *
 * `POST {routes.api}/{collection}/{id}/validate` accepts an optional object body. The optional
 * `locale` query parameter accepts one or more locales, or `locale=all`. The newest available draft
 * is used as the base, falling back to the main document. Field validation failures return a `200`
 * ValidationResult.
 */
export const validateByIDHandler: PayloadHandler = async (req) => {
  const { id, collection } = getRequestCollectionWithID(req)
  try {
    const locale =
      req.query.locale === undefined ? undefined : parseValidationLocaleSelector(req.query.locale)

    if (req.data !== undefined) {
      assertValidationData(req.data)
    }

    const result = await validateLocal(req.payload, {
      id,
      collection: collection.config.slug,
      data: req.data,
      draft: true,
      locale,
      overrideAccess: false,
      req,
    })

    return Response.json(result, {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: 200,
    })
  } finally {
    await unlinkTempFiles({
      collectionConfig: collection.config,
      config: req.payload.config,
      req,
    }).catch((err) => {
      req.payload.logger.error({ err, msg: 'Failed to remove temp file' })
    })
  }
}
