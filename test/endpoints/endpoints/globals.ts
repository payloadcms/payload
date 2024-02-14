import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import { globalEndpoint } from '../shared'

export const globalEndpoints: GlobalConfig['endpoints'] = [
  {
    path: `/${globalEndpoint}`,
    method: 'post',
    handler: ({ req }) => {
      return Response.json(req.body)
    },
  },
]
