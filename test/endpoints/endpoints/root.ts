import type { Response } from 'express'

import express from 'express'

import type { Config } from '../../../packages/payload/src/config/types'
import type { PayloadRequest } from '../../../packages/payload/src/express/types'

import { applicationEndpoint, rootEndpoint } from '../shared'

export const endpoints: Config['endpoints'] = [
  {
    path: `/${applicationEndpoint}`,
    method: 'post',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json(req.body)
    },
  },
  {
    path: `/${applicationEndpoint}`,
    method: 'get',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({ message: 'Hello, world!' })
    },
  },
  {
    path: `/${applicationEndpoint}/i18n`,
    method: 'get',
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({ message: req.t('general:backToDashboard') })
    },
  },
  {
    path: `/${rootEndpoint}`,
    method: 'get',
    root: true,
    handler: (req: PayloadRequest, res: Response): void => {
      res.json({ message: 'Hello, world!' })
    },
  },
  {
    path: `/${rootEndpoint}`,
    method: 'post',
    root: true,
    handler: [
      express.json({ type: 'application/json' }),
      (req: PayloadRequest, res: Response): void => {
        res.json(req.body)
      },
    ],
  },
]
