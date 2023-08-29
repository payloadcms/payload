import { SanitizedCollectionConfig } from './config/types.js';
import { Endpoint } from '../config/types.js';
import find from './requestHandlers/find.js';
import verifyEmail from '../auth/requestHandlers/verifyEmail.js';
import unlock from '../auth/requestHandlers/unlock.js';
import create from './requestHandlers/create.js';
import initHandler from '../auth/requestHandlers/init.js';
import loginHandler from '../auth/requestHandlers/login.js';
import refreshHandler from '../auth/requestHandlers/refresh.js';
import meHandler from '../auth/requestHandlers/me.js';
import registerFirstUserHandler from '../auth/requestHandlers/registerFirstUser.js';
import forgotPasswordHandler from '../auth/requestHandlers/forgotPassword.js';
import resetPassword from '../auth/requestHandlers/resetPassword.js';
import findVersions from './requestHandlers/findVersions.js';
import findVersionByID from './requestHandlers/findVersionByID.js';
import restoreVersion from './requestHandlers/restoreVersion.js';
import deleteHandler from './requestHandlers/delete.js';
import findByID from './requestHandlers/findByID.js';
import update from './requestHandlers/update.js';
import updateByID, { deprecatedUpdate } from './requestHandlers/updateByID.js';
import logoutHandler from '../auth/requestHandlers/logout.js';
import docAccessRequestHandler from './requestHandlers/docAccess.js';
import deleteByID from './requestHandlers/deleteByID.js';

const buildEndpoints = (collection: SanitizedCollectionConfig): Endpoint[] => {
  if (!collection.endpoints) return [];
  const endpoints = [...collection.endpoints];

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

      endpoints.push(
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
      );
    }

    endpoints.push(
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
    );
  }

  if (collection.versions) {
    endpoints.push(
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
    );
  }

  endpoints.push(
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
  );

  return endpoints;
};

export default buildEndpoints;
