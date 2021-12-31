import access from '../auth/requestHandlers/access';
import forgotPassword from '../auth/requestHandlers/forgotPassword';
import init from '../auth/requestHandlers/init';
import login from '../auth/requestHandlers/login';
import logout from '../auth/requestHandlers/logout';
import me from '../auth/requestHandlers/me';
import refresh from '../auth/requestHandlers/refresh';
import registerFirstUser from '../auth/requestHandlers/registerFirstUser';
import resetPassword from '../auth/requestHandlers/resetPassword';
import verifyEmail from '../auth/requestHandlers/verifyEmail';
import unlock from '../auth/requestHandlers/unlock';

import create from '../collections/requestHandlers/create';
import find from '../collections/requestHandlers/find';
import findByID from '../collections/requestHandlers/findByID';
import findVersions from '../collections/requestHandlers/findVersions';
import findVersionByID from '../collections/requestHandlers/findVersionByID';
import publishVersion from '../collections/requestHandlers/publishVersion';
import update from '../collections/requestHandlers/update';
import deleteHandler from '../collections/requestHandlers/delete';

import findOne from '../globals/requestHandlers/findOne';
import findGlobalVersions from '../globals/requestHandlers/findVersions';
import findGlobalVersionByID from '../globals/requestHandlers/findVersionByID';
import publishGlobalVersion from '../globals/requestHandlers/publishVersion';
import globalUpdate from '../globals/requestHandlers/update';
import { Payload } from '../index';
import preferenceUpdate from '../preferences/requestHandlers/update';
import preferenceFindOne from '../preferences/requestHandlers/findOne';
import preferenceDelete from '../preferences/requestHandlers/delete';

export type RequestHandlers = {
  collections: {
    create: typeof create,
    find: typeof find,
    findByID: typeof findByID,
    findVersions: typeof findVersions
    findVersionByID: typeof findVersionByID,
    publishVersion: typeof publishVersion,
    update: typeof update,
    delete: typeof deleteHandler,
    auth: {
      access: typeof access,
      forgotPassword: typeof forgotPassword,
      init: typeof init,
      login: typeof login,
      logout: typeof logout,
      me: typeof me,
      refresh: typeof refresh
      registerFirstUser: typeof registerFirstUser,
      resetPassword: typeof resetPassword,
      verifyEmail: typeof verifyEmail,
      unlock: typeof unlock,
    }
  },
  globals: {
    findOne: typeof findOne,
    update: typeof globalUpdate,
    findVersions: typeof findGlobalVersions
    findVersionByID: typeof findGlobalVersionByID
    publishVersion: typeof publishGlobalVersion
  },
  preferences: {
    update: typeof preferenceUpdate,
    findOne: typeof preferenceFindOne,
    delete: typeof preferenceDelete,
  },
}

function bindRequestHandlers(ctx: Payload): void {
  ctx.requestHandlers = {
    collections: {
      create: create.bind(ctx),
      find: find.bind(ctx),
      findByID: findByID.bind(ctx),
      findVersions: findVersions.bind(ctx),
      findVersionByID: findVersionByID.bind(ctx),
      publishVersion: publishVersion.bind(ctx),
      update: update.bind(ctx),
      delete: deleteHandler.bind(ctx),
      auth: {
        access: access.bind(ctx),
        forgotPassword: forgotPassword.bind(ctx),
        init: init.bind(ctx),
        login: login.bind(ctx),
        logout: logout.bind(ctx),
        me: me.bind(ctx),
        refresh: refresh.bind(ctx),
        registerFirstUser: registerFirstUser.bind(ctx),
        resetPassword: resetPassword.bind(ctx),
        verifyEmail: verifyEmail.bind(ctx),
        unlock: unlock.bind(ctx),
      },
    },
    globals: {
      findOne: findOne.bind(ctx),
      update: globalUpdate.bind(ctx),
      findVersions: findGlobalVersions.bind(ctx),
      findVersionByID: findGlobalVersionByID.bind(ctx),
      publishVersion: publishGlobalVersion.bind(ctx),
    },
    preferences: {
      update: preferenceUpdate.bind(ctx),
      findOne: preferenceFindOne.bind(ctx),
      delete: preferenceDelete.bind(ctx),
    },
  };
}

export default bindRequestHandlers;
