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
import findVersions from '../collections/operations/findVersions';
import findVersionByID from '../collections/operations/findVersionByID';
import publishVersion from '../collections/operations/publishVersion';
import update from '../collections/operations/update';
import deleteHandler from '../collections/operations/delete';

import findOne from '../globals/operations/findOne';
import findGlobalVersions from '../globals/operations/findVersions';
import findGlobalVersionByID from '../globals/operations/findVersionByID';
import publishGlobalVersion from '../globals/operations/publishVersion';
import globalUpdate from '../globals/operations/update';

import preferenceUpdate from '../preferences/operations/update';
import preferenceFindOne from '../preferences/operations/findOne';
import preferenceDelete from '../preferences/operations/delete';

export type Operations = {
  collections: {
    create: typeof create
    find: typeof find
    findByID: typeof findByID
    findVersions: typeof findVersions
    findVersionByID: typeof findVersionByID
    publishVersion: typeof publishVersion
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
    findVersions: typeof findGlobalVersions
    findVersionByID: typeof findGlobalVersionByID
    publishVersion: typeof publishGlobalVersion
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
      findVersions: findGlobalVersions.bind(ctx),
      findVersionByID: findGlobalVersionByID.bind(ctx),
      publishVersion: publishGlobalVersion.bind(ctx),
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
