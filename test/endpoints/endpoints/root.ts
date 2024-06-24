import type { Config } from 'payload'

import { applicationEndpoint, rootEndpoint } from '../shared.js'

export const endpoints: Config['endpoints'] = [
  {
    path: `/${applicationEndpoint}`,
    method: 'post',
    handler: (req) => {
      return Response.json(req.body)
    },
  },
  {
    path: `/${applicationEndpoint}`,
    method: 'get',
    handler: () => {
      return Response.json({ message: 'Hello, world!' })
    },
  },
  {
    path: `/${applicationEndpoint}/i18n`,
    method: 'get',
    handler: (req) => {
      return Response.json({ message: req.t('general:updatedSuccessfully') })
    },
  },
  {
    path: `/${rootEndpoint}`,
    method: 'get',
    handler: () => {
      return Response.json({ message: 'Hello, world!' })
    },
  },
  {
    path: `/${rootEndpoint}`,
    method: 'post',
    handler: (req) => {
      return Response.json(req.body)
    },
  },
]
