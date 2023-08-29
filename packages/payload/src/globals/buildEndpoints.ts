import type { Endpoint } from '../config/types.js';
import type { SanitizedGlobalConfig } from './config/types.js';

import docAccessRequestHandler from './requestHandlers/docAccess.js';
import findOne from './requestHandlers/findOne.js';
import findVersionByID from './requestHandlers/findVersionByID.js';
import findVersions from './requestHandlers/findVersions.js';
import restoreVersion from './requestHandlers/restoreVersion.js';
import update from './requestHandlers/update.js';

const buildEndpoints = (global: SanitizedGlobalConfig): Endpoint[] => {
  if (!global.endpoints) return [];
  const endpoints = [...global.endpoints];

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
    );
  }

  endpoints.push(
    {
      handler: async (req, res, next) => docAccessRequestHandler(req, res, next, global),
      method: 'get',
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
  );

  return endpoints;
};

export default buildEndpoints;
