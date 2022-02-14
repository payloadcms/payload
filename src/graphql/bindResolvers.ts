import access from '../auth/graphql/resolvers/access';
import forgotPassword from '../auth/graphql/resolvers/forgotPassword';
import init from '../auth/graphql/resolvers/init';
import login from '../auth/graphql/resolvers/login';
import logout from '../auth/graphql/resolvers/logout';
import me from '../auth/graphql/resolvers/me';
import refresh from '../auth/graphql/resolvers/refresh';
import resetPassword from '../auth/graphql/resolvers/resetPassword';
import verifyEmail from '../auth/graphql/resolvers/verifyEmail';
import unlock from '../auth/graphql/resolvers/unlock';

import create from '../collections/graphql/resolvers/create';
import find from '../collections/graphql/resolvers/find';
import findByID from '../collections/graphql/resolvers/findByID';
import update from '../collections/graphql/resolvers/update';
import deleteResolver from '../collections/graphql/resolvers/delete';
import findVersions from '../collections/graphql/resolvers/findVersions';
import findVersionByID from '../collections/graphql/resolvers/findVersionByID';
import restoreVersion from '../collections/graphql/resolvers/restoreVersion';

import findOne from '../globals/graphql/resolvers/findOne';
import globalUpdate from '../globals/graphql/resolvers/update';
import globalFindVersionByID from '../globals/graphql/resolvers/findVersionByID';
import globalFindVersions from '../globals/graphql/resolvers/findVersions';
import globalRestoreVersion from '../globals/graphql/resolvers/restoreVersion';

import { Payload } from '../index';

export type GraphQLResolvers = {
  collections: {
    create: typeof create,
    find: typeof find,
    findVersions: typeof findVersions,
    findByID: typeof findByID,
    findVersionByID: typeof findVersionByID,
    restoreVersion: typeof restoreVersion,
    update: typeof update,
    deleteResolver: typeof deleteResolver,
    auth: {
      access: typeof access,
      forgotPassword: typeof forgotPassword,
      init: typeof init,
      login: typeof login,
      logout: typeof logout,
      me: typeof me,
      refresh: typeof refresh,
      resetPassword: typeof resetPassword,
      verifyEmail: typeof verifyEmail,
      unlock: typeof unlock,
    }
  }
  globals: {
    findOne: typeof findOne
    update: typeof globalUpdate,
    findVersionByID: typeof globalFindVersionByID,
    findVersions: typeof globalFindVersions,
    restoreVersion: typeof globalRestoreVersion,
  }
}

function bindResolvers(ctx: Payload): void {
  ctx.graphQL = {
    resolvers: {
      collections: {
        create: create.bind(ctx),
        find: find.bind(ctx),
        findVersions: findVersions.bind(ctx),
        findByID: findByID.bind(ctx),
        findVersionByID: findVersionByID.bind(ctx),
        restoreVersion: restoreVersion.bind(ctx),
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
          unlock: unlock.bind(ctx),
        },
      },
      globals: {
        findOne: findOne.bind(ctx),
        update: globalUpdate.bind(ctx),
        findVersionByID: globalFindVersionByID.bind(ctx),
        findVersions: globalFindVersions.bind(ctx),
        restoreVersion: globalRestoreVersion.bind(ctx),
      },
    },
  };
}

export default bindResolvers;
