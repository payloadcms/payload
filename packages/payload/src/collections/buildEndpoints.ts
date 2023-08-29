import type { Endpoint } from '../config/types.js';
import type { SanitizedCollectionConfig } from './config/types.js';

import forgotPasswordHandler from '../auth/requestHandlers/forgotPassword.js';
import initHandler from '../auth/requestHandlers/init.js';
import loginHandler from '../auth/requestHandlers/login.js';
import logoutHandler from '../auth/requestHandlers/logout.js';
import meHandler from '../auth/requestHandlers/me.js';
import refreshHandler from '../auth/requestHandlers/refresh.js';
import registerFirstUserHandler from '../auth/requestHandlers/registerFirstUser.js';
import resetPassword from '../auth/requestHandlers/resetPassword.js';
import unlock from '../auth/requestHandlers/unlock.js';
import verifyEmail from '../auth/requestHandlers/verifyEmail.js';
import create from './requestHandlers/create.js';
import deleteHandler from './requestHandlers/delete.js';
import deleteByID from './requestHandlers/deleteByID.js';
import docAccessRequestHandler from './requestHandlers/docAccess.js';
import find from './requestHandlers/find.js';
import findByID from './requestHandlers/findByID.js';
import findVersionByID from './requestHandlers/findVersionByID.js';
import findVersions from './requestHandlers/findVersions.js';
import restoreVersion from './requestHandlers/restoreVersion.js';
import update from './requestHandlers/update.js';
import updateByID, { deprecatedUpdate } from './requestHandlers/updateByID.js';

const buildEndpoints = (collection: SanitizedCollectionConfig): Endpoint[] => {
  if (!collection.endpoints) return [];
  const endpoints = [...collection.endpoints];

  if (collection.auth) {
    if (!collection.auth.disableLocalStrategy) {
      if (collection.auth.verify) {
        endpoints.push({
          handler: verifyEmail,
          method: 'post',
          path: '/verify/:token',
        });
      }

      if (collection.auth.maxLoginAttempts > 0) {
        endpoints.push({
          handler: unlock,
          method: 'post',
          path: '/unlock',
        });
      }

      endpoints.push(
        {
          handler: loginHandler,
          method: 'post',
          path: '/login',
        },
        {
          handler: registerFirstUserHandler,
          method: 'post',
          path: '/first-register',
        },
        {
          handler: forgotPasswordHandler,
          method: 'post',
          path: '/forgot-password',
        },
        {
          handler: resetPassword,
          method: 'post',
          path: '/reset-password',
        },
      );
    }

    endpoints.push(
      {
        handler: initHandler,
        method: 'get',
        path: '/init',
      },
      {
        handler: meHandler,
        method: 'get',
        path: '/me',
      },
      {
        handler: logoutHandler,
        method: 'post',
        path: '/logout',
      },
      {
        handler: refreshHandler,
        method: 'post',
        path: '/refresh-token',
      },
    );
  }

  if (collection.versions) {
    endpoints.push(
      {
        handler: findVersions,
        method: 'get',
        path: '/versions',
      },
      {
        handler: findVersionByID,
        method: 'get',
        path: '/versions/:id',
      },
      {
        handler: restoreVersion,
        method: 'post',
        path: '/versions/:id',
      },
    );
  }

  endpoints.push(
    {
      handler: find,
      method: 'get',
      path: '/',
    },
    {
      handler: create,
      method: 'post',
      path: '/',
    },
    {
      handler: docAccessRequestHandler,
      method: 'get',
      path: '/access/:id',
    },
    {
      handler: deprecatedUpdate,
      method: 'put',
      path: '/:id',
    },
    {
      handler: update,
      method: 'patch',
      path: '/',
    },
    {
      handler: updateByID,
      method: 'patch',
      path: '/:id',
    },
    {
      handler: findByID,
      method: 'get',
      path: '/:id',
    },
    {
      handler: deleteByID,
      method: 'delete',
      path: '/:id',
    },
    {
      handler: deleteHandler,
      method: 'delete',
      path: '/',
    },
  );

  return endpoints;
};

export default buildEndpoints;
