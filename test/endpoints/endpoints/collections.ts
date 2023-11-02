import type { Response } from 'express'

import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'
import type { PayloadRequest } from '../../../packages/payload/src/express/types'

export const collectionEndpoints: CollectionConfig['endpoints'] = [
  {
    path: '/say-hello/joe-bloggs',
    method: 'get',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({ message: 'Hey Joey!' })
    },
  },
  {
    path: '/say-hello/:group/:name',
    method: 'get',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({ message: `Hello ${req.params.name} @ ${req.params.group}` })
    },
  },
  {
    path: '/say-hello/:name',
    method: 'get',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({ message: `Hello ${req.params.name}!` })
    },
  },
  {
    path: '/whoami',
    method: 'post',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({
        name: req.body.name,
        age: req.body.age,
      })
    },
  },
]
