const access = require('../auth/requestHandlers/access');
const forgotPassword = require('../auth/requestHandlers/forgotPassword');
const init = require('../auth/requestHandlers/init');
const login = require('../auth/requestHandlers/login');
const logout = require('../auth/requestHandlers/logout');
const me = require('../auth/requestHandlers/me');
const refresh = require('../auth/requestHandlers/refresh');
const registerFirstUser = require('../auth/requestHandlers/registerFirstUser');
const resetPassword = require('../auth/requestHandlers/resetPassword');

const create = require('../collections/requestHandlers/create');
const find = require('../collections/requestHandlers/find');
const findByID = require('../collections/requestHandlers/findByID');
const update = require('../collections/requestHandlers/update');
const deleteHandler = require('../collections/requestHandlers/delete');

const findOne = require('../globals/requestHandlers/findOne');
const globalUpdate = require('../globals/requestHandlers/update');

function bindRequestHandlers(ctx) {
  const payload = ctx;

  payload.requestHandlers = {
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
      },
    },
    globals: {
      findOne: findOne.bind(ctx),
      update: globalUpdate.bind(ctx),
    },
  };
}

module.exports = bindRequestHandlers;
