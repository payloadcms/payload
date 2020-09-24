const access = require('../auth/graphql/resolvers/access');
const forgotPassword = require('../auth/graphql/resolvers/forgotPassword');
const init = require('../auth/graphql/resolvers/init');
const login = require('../auth/graphql/resolvers/login');
const logout = require('../auth/graphql/resolvers/logout');
const me = require('../auth/graphql/resolvers/me');
const refresh = require('../auth/graphql/resolvers/refresh');
const resetPassword = require('../auth/graphql/resolvers/resetPassword');
const verifyEmail = require('../auth/graphql/resolvers/verifyEmail');

const create = require('../collections/graphql/resolvers/create');
const find = require('../collections/graphql/resolvers/find');
const findByID = require('../collections/graphql/resolvers/findByID');
const update = require('../collections/graphql/resolvers/update');
const deleteResolver = require('../collections/graphql/resolvers/delete');

const findOne = require('../globals/graphql/resolvers/findOne');
const globalUpdate = require('../globals/graphql/resolvers/update');

function bindResolvers(ctx) {
  const payload = ctx;

  payload.graphQL = {
    resolvers: {
      collections: {
        create: create.bind(ctx),
        find: find.bind(ctx),
        findByID: findByID.bind(ctx),
        update: update.bind(ctx),
        deleteResolver: deleteResolver.bind(ctx),
        auth: {
          access: access.bind(ctx),
          forgotPassword: forgotPassword.bind(ctx),
          init: init.bind(ctx),
          login: login.bind(ctx),
          logout: logout.bind(ctx),
          me: me.bind(ctx),
          refresh: refresh.bind(ctx),
          resetPassword: resetPassword.bind(ctx),
          verifyEmail: verifyEmail.bind(ctx),
        },
      },
      globals: {
        findOne: findOne.bind(ctx),
        update: globalUpdate.bind(ctx),
      },
    },
  };
}

module.exports = bindResolvers;
