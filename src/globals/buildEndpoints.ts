import { Endpoint } from '../config/types';
import findVersions from './requestHandlers/findVersions';
import findVersionByID from './requestHandlers/findVersionByID';
import restoreVersion from './requestHandlers/restoreVersion';
import { SanitizedGlobalConfig } from './config/types';
import update from './requestHandlers/update';
import findOne from './requestHandlers/findOne';
import docAccessRequestHandler from './requestHandlers/docAccess';

const buildEndpoints = (global: SanitizedGlobalConfig): Endpoint[] => {
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
