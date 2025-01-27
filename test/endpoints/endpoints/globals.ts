import type { Response } from 'express'

import type { PayloadRequest } from '../../../packages/payload/src/express/types'
import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import { globalEndpoint } from '../shared'

export const globalEndpoints: GlobalConfig['endpoints'] = [
  {
    path: `/${globalEndpoint}`,
    method: 'post',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json(req.body)
    },
  },
]
