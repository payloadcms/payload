import type { PayloadHandler } from '../../config/types.js'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { includeAccessSchema } from '../includeAccessSchema.js'
import { accessOperation } from '../operations/access.js'

export const accessHandler: PayloadHandler = async (req) => {
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  try {
    const results = await accessOperation({
      req,
    })

    if (
      req.payload.config.enableAccessSchema === true &&
      req.searchParams.get('includeSchema') === 'true'
    ) {
      headers.set('Cache-Control', 'private, no-store')
      return Response.json(includeAccessSchema({ permissions: results, req }), { headers })
    }

    return Response.json(results, {
      headers,
      status: httpStatus.OK,
    })
  } catch (e: unknown) {
    return Response.json(
      {
        error: e,
      },
      {
        headers,
        status: httpStatus.INTERNAL_SERVER_ERROR,
      },
    )
  }
}
