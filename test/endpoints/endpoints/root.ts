import type { Config } from '../../../packages/payload/src/config/types'

import { applicationEndpoint, rootEndpoint } from '../shared'

export const endpoints: Config['endpoints'] = [
  {
    path: `/${applicationEndpoint}`,
    method: 'post',
    handler: ({ req }) => {
      return Response.json(req.body)
    },
  },
  {
    path: `/${applicationEndpoint}`,
    method: 'get',
    handler: ({ req }) => {
      return Response.json({ message: 'Hello, world!' })
    },
  },
  {
    path: `/${applicationEndpoint}/i18n`,
    method: 'get',
    handler: ({ req }) => {
      return Response.json({ message: req.t('general:backToDashboard') })
    },
  },
  {
    path: `/${rootEndpoint}`,
    method: 'get',
    root: true,
    handler: () => {
      return Response.json({ message: 'Hello, world!' })
    },
  },
  {
    path: `/${rootEndpoint}`,
    method: 'post',
    root: true,
    handler: ({ req }) => {
      return Response.json(req.body)
    },
  },
]
