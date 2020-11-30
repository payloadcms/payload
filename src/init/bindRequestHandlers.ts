import access, { AccessRequestHandler } from '../auth/requestHandlers/access';
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

import create, { CreateRequestHandler } from '../collections/requestHandlers/create';
import find, { FindRequestHandler } from '../collections/requestHandlers/find';
import findByID, { FindByIDRequestHandler } from '../collections/requestHandlers/findByID';
import update, { UpdateRequestHandler } from '../collections/requestHandlers/update';
import deleteHandler, { DeleteRequestHandler } from '../collections/requestHandlers/delete';

import findOne from '../globals/requestHandlers/findOne';
import globalUpdate from '../globals/requestHandlers/update';
import { Payload } from '../index';

export type RequestHandlers = {
  collections: {
    create: CreateRequestHandler,
    find: FindRequestHandler,
    findByID: FindByIDRequestHandler,
    update: UpdateRequestHandler,
    delete: DeleteRequestHandler,
    auth: {
      access: AccessRequestHandler,
    }
  }
}

function bindRequestHandlers(ctx: Payload): void {
  ctx.requestHandlers = {
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

export default bindRequestHandlers;
