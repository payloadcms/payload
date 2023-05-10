import { SanitizedCollectionConfig } from './config/types';
import { Endpoint } from '../config/types';
import find from './requestHandlers/find';
import verifyEmail from '../auth/requestHandlers/verifyEmail';
import unlock from '../auth/requestHandlers/unlock';
import create from './requestHandlers/create';
import initHandler from '../auth/requestHandlers/init';
import loginHandler from '../auth/requestHandlers/login';
import refreshHandler from '../auth/requestHandlers/refresh';
import meHandler from '../auth/requestHandlers/me';
import registerFirstUserHandler from '../auth/requestHandlers/registerFirstUser';
import forgotPasswordHandler from '../auth/requestHandlers/forgotPassword';
import resetPassword from '../auth/requestHandlers/resetPassword';
import findVersions from './requestHandlers/findVersions';
import findVersionByID from './requestHandlers/findVersionByID';
import restoreVersion from './requestHandlers/restoreVersion';
import deleteHandler from './requestHandlers/delete';
import findByID from './requestHandlers/findByID';
import update from './requestHandlers/update';
import updateByID, { deprecatedUpdate } from './requestHandlers/updateByID';
import logoutHandler from '../auth/requestHandlers/logout';
import docAccessRequestHandler from './requestHandlers/docAccess';
import deleteByID from './requestHandlers/deleteByID';

const buildEndpoints = (collection: SanitizedCollectionConfig): Endpoint[] => {
  let { endpoints } = collection;

  if (collection.auth) {
    if (!collection.auth.disableLocalStrategy) {
      if (collection.auth.verify) {
        endpoints.push({
          path: '/verify/:token',
          method: 'post',
          handler: verifyEmail,
        });
      }

      if (collection.auth.maxLoginAttempts > 0) {
        endpoints.push({
          path: '/unlock',
          method: 'post',
          handler: unlock,
        });
      }

      endpoints = endpoints.concat([
        {
          path: '/login',
          method: 'post',
          handler: loginHandler,
        },
        {
          path: '/first-register',
          method: 'post',
          handler: registerFirstUserHandler,
        },
        {
          path: '/forgot-password',
          method: 'post',
          handler: forgotPasswordHandler,
        },
        {
          path: '/reset-password',
          method: 'post',
          handler: resetPassword,
        },
      ]);
    }

    endpoints = endpoints.concat([
      {
        path: '/init',
        method: 'get',
        handler: initHandler,
      },
      {
        path: '/me',
        method: 'get',
        handler: meHandler,
      },
      {
        path: '/logout',
        method: 'post',
        handler: logoutHandler,
      },
      {
        path: '/refresh-token',
        method: 'post',
        handler: refreshHandler,
      },
    ]);
  }

  if (collection.versions) {
    endpoints = endpoints.concat([
      {
        path: '/versions',
        method: 'get',
        handler: findVersions,
      },
      {
        path: '/versions/:id',
        method: 'get',
        handler: findVersionByID,
      },
      {
        path: '/versions/:id',
        method: 'post',
        handler: restoreVersion,
      },
    ]);
  }

  return endpoints.concat([
    {
      path: '/',
      method: 'get',
      handler: find,
    },
    {
      path: '/',
      method: 'post',
      handler: create,
    },
    {
      path: '/access/:id',
      method: 'get',
      handler: docAccessRequestHandler,
    },
    {
      path: '/:id',
      method: 'put',
      handler: deprecatedUpdate,
    },
    {
      path: '/',
      method: 'patch',
      handler: update,
    },
    {
      path: '/:id',
      method: 'patch',
      handler: updateByID,
    },
    {
      path: '/:id',
      method: 'get',
      handler: findByID,
    },
    {
      path: '/:id',
      method: 'delete',
      handler: deleteByID,
    },
    {
      path: '/',
      method: 'delete',
      handler: deleteHandler,
    },
  ]);
};

export default buildEndpoints;
