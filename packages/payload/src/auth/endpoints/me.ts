import { status as httpStatus } from 'http-status'

import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { isNumber } from '../../utilities/isNumber.js'
import { sanitizePopulateParam } from '../../utilities/sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../../utilities/sanitizeSelectParam.js'
import { extractJWT } from '../extractJWT.js'
import { meOperation } from '../operations/me.js'

export const meHandler: PayloadHandler = async (req) => {
  const { searchParams } = req
  const collection = getRequestCollection(req)
  const currentToken = extractJWT(req)
  const depth = searchParams.get('depth')

  const result = await meOperation({
    collection,
    currentToken: currentToken!,
    depth: isNumber(depth) ? Number(depth) : undefined,
    draft: searchParams.get('draft') === 'true',
    populate: sanitizePopulateParam(req.query.populate),
    req,
    select: sanitizeSelectParam(req.query.select),
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return Response.json(
    {
      ...result,
      message: req.t('authentication:account'),
    },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
      status: httpStatus.OK,
    },
  )
}
