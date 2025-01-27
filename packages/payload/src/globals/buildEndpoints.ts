import type { Endpoint } from '../config/types'
import type { SanitizedGlobalConfig } from './config/types'

import docAccessRequestHandler from './requestHandlers/docAccess'
import findOne from './requestHandlers/findOne'
import findVersionByID from './requestHandlers/findVersionByID'
import findVersions from './requestHandlers/findVersions'
import restoreVersion from './requestHandlers/restoreVersion'
import update from './requestHandlers/update'

const buildEndpoints = (global: SanitizedGlobalConfig): Endpoint[] => {
  if (!global.endpoints) return []
  const endpoints = [...global.endpoints]

  if (global.versions) {
    endpoints.push(
      {
        handler: findVersions(global),
        method: 'get',
        path: '/versions',
      },
      {
        handler: findVersionByID(global),
        method: 'get',
        path: '/versions/:id',
      },
      {
        handler: restoreVersion(global),
        method: 'post',
        path: '/versions/:id',
      },
    )
  }

  endpoints.push(
    {
      handler: async (req, res, next) => docAccessRequestHandler(req, res, next, global),
      method: 'get',
      path: '/access',
    },
    {
      handler: async (req, res, next) => docAccessRequestHandler(req, res, next, global),
      method: 'post',
      path: '/access',
    },
    {
      handler: findOne(global),
      method: 'get',
      path: '/',
    },
    {
      handler: update(global),
      method: 'post',
      path: '/',
    },
  )

  return endpoints
}

export default buildEndpoints
