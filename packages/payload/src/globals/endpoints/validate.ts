import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import {
  assertValidationData,
  parseValidationLocaleSelector,
} from '../../utilities/parseValidationLocale.js'
import { validateGlobalLocal } from '../operations/local/validate.js'

/**
 * Validates a global with optional partial candidate data.
 *
 * `POST {routes.api}/globals/{global}/validate` accepts an optional object body and requires one or
 * more `locale` query parameters, or `locale=all`. The newest available draft is used as the base,
 * falling back to the main global. Field validation failures return a `200` ValidationResult.
 */
export const validateHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const locale = parseValidationLocaleSelector(req.query.locale)

  if (req.data !== undefined) {
    assertValidationData(req.data)
  }

  const result = await validateGlobalLocal(req.payload, {
    slug: globalConfig.slug,
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
    status: httpStatus.OK,
  })
}
