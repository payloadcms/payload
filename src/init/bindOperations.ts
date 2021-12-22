import { Payload } from '../index';
import access from '../auth/operations/access';
import forgotPassword from '../auth/operations/forgotPassword';
import init from '../auth/operations/init';
import login from '../auth/operations/login';
import logout from '../auth/operations/logout';
import me from '../auth/operations/me';
import refresh from '../auth/operations/refresh';
import registerFirstUser from '../auth/operations/registerFirstUser';
import resetPassword from '../auth/operations/resetPassword';
import verifyEmail from '../auth/operations/verifyEmail';
import unlock from '../auth/operations/unlock';

import create from '../collections/operations/create';
import find from '../collections/operations/find';
import findByID from '../collections/operations/findByID';
import findRevisions from '../collections/operations/findRevisions';
import findRevisionByID from '../collections/operations/findRevisionByID';
import restoreRevision from '../collections/operations/restoreRevision';
import update from '../collections/operations/update';
import deleteHandler from '../collections/operations/delete';

import findOne from '../globals/operations/findOne';
import findGlobalRevisions from '../globals/operations/findRevisions';
import findGlobalRevisionByID from '../globals/operations/findRevisionByID';
import restoreGlobalRevision from '../globals/operations/restoreRevision';
import globalUpdate from '../globals/operations/update';

import preferenceUpdate from '../preferences/operations/update';
import preferenceFindOne from '../preferences/operations/findOne';
import preferenceDelete from '../preferences/operations/delete';

export type Operations = {
  collections: {
    create: typeof create
    find: typeof find
    findByID: typeof findByID
    findRevisions: typeof findRevisions
    findRevisionByID: typeof findRevisionByID
    restoreRevision: typeof restoreRevision
    update: typeof update
    delete: typeof deleteHandler
    auth: {
      access: typeof access
      forgotPassword: typeof forgotPassword
      init: typeof init
      login: typeof login
      logout: typeof logout
      me: typeof me
      refresh: typeof refresh
      registerFirstUser: typeof registerFirstUser
      resetPassword: typeof resetPassword
      verifyEmail: typeof verifyEmail
      unlock: typeof unlock
    }
  }
  globals: {
    findOne: typeof findOne
    findRevisions: typeof findGlobalRevisions
    findRevisionByID: typeof findGlobalRevisionByID
    restoreRevision: typeof restoreGlobalRevision
    update: typeof globalUpdate
  }
  preferences: {
    update: typeof preferenceUpdate
    findOne: typeof preferenceFindOne
    delete: typeof preferenceDelete
  }
}

function bindOperations(ctx: Payload): void {
  ctx.operations = {
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
      findRevisions: findGlobalRevisions.bind(ctx),
      findRevisionByID: findGlobalRevisionByID.bind(ctx),
      restoreRevision: restoreGlobalRevision.bind(ctx),
      update: globalUpdate.bind(ctx),
    },
    preferences: {
      update: preferenceUpdate.bind(ctx),
      findOne: preferenceFindOne.bind(ctx),
      delete: preferenceDelete.bind(ctx),
    },
  };
}

export default bindOperations;
