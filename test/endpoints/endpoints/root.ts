import type { Config } from 'payload'

import { applicationEndpoint, rootEndpoint } from '../shared.js'

export const endpoints: Config['endpoints'] = [
  {
    handler: (req) => {
      return Response.json(req.body)
    },
    method: 'post',
    path: `/${applicationEndpoint}`,
  },
  {
    handler: () => {
      return Response.json({ message: 'Hello, world!' })
    },
    method: 'get',
    path: `/${applicationEndpoint}`,
  },
  {
    handler: (req) => {
      return Response.json({ message: req.t('general:updatedSuccessfully') })
    },
    method: 'get',
    path: `/${applicationEndpoint}/i18n`,
  },
  {
    handler: () => {
      return Response.json({ message: 'Hello, world!' })
    },
    method: 'get',
    path: `/${rootEndpoint}`,
  },
  {
    handler: (req) => {
      return Response.json(req.body)
    },
    method: 'post',
    path: `/${rootEndpoint}`,
  },
]
