import type { GlobalConfig } from 'payload'

import { globalEndpoint } from '../shared.js'

export const globalEndpoints: GlobalConfig['endpoints'] = [
  {
    path: `/${globalEndpoint}`,
    method: 'post',
    handler: (req) => {
      return Response.json(req.body)
    },
  },
]
