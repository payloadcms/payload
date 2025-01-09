import type { Endpoint } from './types.js'

import { headersWithCors } from '../utilities/headersWithCors.js'

export const optionsEndpoint: Endpoint = {
  handler: (req) => {
    return Response.json(
      {},
      {
        headers: headersWithCors({
          headers: new Headers(),
          req,
        }),
        status: 200,
      },
    )
  },
  method: 'options',
  path: '/*',
}
