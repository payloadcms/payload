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
import update from '../collections/operations/update';
import deleteHandler from '../collections/operations/delete';

import findOne from '../globals/operations/findOne';
import globalUpdate from '../globals/operations/update';

function bindOperations(ctx: Payload): void {
  ctx.operations = {
    collections: {
      create: create.bind(ctx),
      find: find.bind(ctx),
      findByID: findByID.bind(ctx),
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
    },
  };
}

export default bindOperations;
