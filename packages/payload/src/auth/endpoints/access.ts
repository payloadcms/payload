import type { PayloadHandler } from '../../config/types.js'

import { headersWithCors } from '../../utilities/headersWithCors.js'
import { httpStatus } from '../../utilities/httpStatus.js'
import { accessOperation } from '../operations/access.js'

export const accessHandler: PayloadHandler = async (req) => {
  const headers = headersWithCors({
    headers: new Headers(),
    req,
  })

  try {
    const skipFieldPermissions = req.searchParams.get('includeFields') === 'false'
    const results = await accessOperation({
      req,
      skipFieldPermissions,
    })

    if (skipFieldPermissions) {
      for (const permissions of [
        ...Object.values(results.collections ?? {}),
        ...Object.values(results.globals ?? {}),
      ]) {
        const entityPermissions: Partial<typeof permissions> = permissions
        delete entityPermissions.fields
      }
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
