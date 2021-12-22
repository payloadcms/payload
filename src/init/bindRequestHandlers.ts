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
import findRevisions from '../collections/requestHandlers/findRevisions';
import findRevisionByID from '../collections/requestHandlers/findRevisionByID';
import restoreRevision from '../collections/requestHandlers/restoreRevision';
import update from '../collections/requestHandlers/update';
import deleteHandler from '../collections/requestHandlers/delete';

import findOne from '../globals/requestHandlers/findOne';
import findGlobalRevisions from '../globals/requestHandlers/findRevisions';
import findGlobalRevisionByID from '../globals/requestHandlers/findRevisionByID';
import restoreGlobalRevision from '../globals/requestHandlers/restoreRevision';
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
    findRevisions: typeof findRevisions,
    findRevisionByID: typeof findRevisionByID,
    restoreRevision: typeof restoreRevision,
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
    findRevisions: typeof findGlobalRevisions
    findRevisionByID: typeof findGlobalRevisionByID
    restoreRevision: typeof restoreGlobalRevision
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
      findRevisions: findRevisions.bind(ctx),
      findRevisionByID: findRevisionByID.bind(ctx),
      restoreRevision: restoreRevision.bind(ctx),
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
      findRevisions: findGlobalRevisions.bind(ctx),
      findRevisionByID: findGlobalRevisionByID.bind(ctx),
      restoreRevision: restoreGlobalRevision.bind(ctx),
    },
    preferences: {
      update: preferenceUpdate.bind(ctx),
      findOne: preferenceFindOne.bind(ctx),
      delete: preferenceDelete.bind(ctx),
    },
  };
}

export default bindRequestHandlers;
