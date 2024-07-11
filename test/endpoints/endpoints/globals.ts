import type { GlobalConfig } from 'payload'

import { globalEndpoint } from '../shared.js'

export const globalEndpoints: GlobalConfig['endpoints'] = [
  {
    handler: (req) => {
      return Response.json(req.body)
    },
    method: 'post',
    path: `/${globalEndpoint}`,
  },
]
