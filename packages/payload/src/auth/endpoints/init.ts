import type { PayloadHandler } from '../../config/types.js'

import { getRequestCollection } from '../../utilities/getRequestEntity.js'
import { headersWithCors } from '../../utilities/headersWithCors.js'
import { initOperation } from '../operations/init.js'

export const initHandler: PayloadHandler = async (req) => {
  const initialized = await initOperation({
    collection: getRequestCollection(req).config.slug,
    req,
  })

  return Response.json(
    { initialized },
    {
      headers: headersWithCors({
        headers: new Headers(),
        req,
      }),
    },
  )
}
