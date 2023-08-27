import { Endpoint } from '../config/types.js';
import findVersions from './requestHandlers/findVersions.js';
import findVersionByID from './requestHandlers/findVersionByID.js';
import restoreVersion from './requestHandlers/restoreVersion.js';
import { SanitizedGlobalConfig } from './config/types.js';
import update from './requestHandlers/update.js';
import findOne from './requestHandlers/findOne.js';
import docAccessRequestHandler from './requestHandlers/docAccess.js';

const buildEndpoints = (global: SanitizedGlobalConfig): Endpoint[] => {
  if (!global.endpoints) return [];
  const endpoints = [...global.endpoints];

  if (global.versions) {
    endpoints.push(
      {
        path: '/versions',
        method: 'get',
        handler: findVersions(global),
      },
      {
        path: '/versions/:id',
        method: 'get',
        handler: findVersionByID(global),
      },
      {
        path: '/versions/:id',
        method: 'post',
        handler: restoreVersion(global),
      },
    );
  }

  endpoints.push(
    {
      path: '/access',
      method: 'get',
      handler: async (req, res, next) => docAccessRequestHandler(req, res, next, global),
    },
    {
      path: '/',
      method: 'get',
      handler: findOne(global),
    },
    {
      path: '/',
      method: 'post',
      handler: update(global),
    },
  );

  return endpoints;
};

export default buildEndpoints;
