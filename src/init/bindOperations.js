const access = require('../auth/operations/access');
const forgotPassword = require('../auth/operations/forgotPassword');
const init = require('../auth/operations/init');
const login = require('../auth/operations/login');
const logout = require('../auth/operations/logout');
const me = require('../auth/operations/me');
const refresh = require('../auth/operations/refresh');
const registerFirstUser = require('../auth/operations/registerFirstUser');
const resetPassword = require('../auth/operations/resetPassword');

const create = require('../collections/operations/create');
const find = require('../collections/operations/find');
const findByID = require('../collections/operations/findByID');
const update = require('../collections/operations/update');
const deleteHandler = require('../collections/operations/delete');

const findOne = require('../globals/operations/findOne');
const globalUpdate = require('../globals/operations/update');

function bindOperations(ctx) {
  const payload = ctx;

  payload.operations = {
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

module.exports = bindOperations;
