import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestGlobal } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import {
  assertValidationData,
  parseSingleValidationLocale,
} from '../../utilities/parseValidationLocale.js'
import { validateGlobalLocal } from '../operations/local/validate.js'

export const validateHandler: PayloadHandler = async (req) => {
  const globalConfig = getRequestGlobal(req)
  const locale = parseSingleValidationLocale(req.query.locale)

  if (req.data !== undefined) {
    assertValidationData(req.data)
  }

  const result = await validateGlobalLocal(req.payload, {
    slug: globalConfig.slug,
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
