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

import deleteResolver from '../collections/graphql/resolvers/delete';

import findOne from '../globals/graphql/resolvers/findOne';
import globalUpdate from '../globals/graphql/resolvers/update';
import globalFindVersionByID from '../globals/graphql/resolvers/findVersionByID';
import globalFindVersions from '../globals/graphql/resolvers/findVersions';
import globalRestoreVersion from '../globals/graphql/resolvers/restoreVersion';

import { Payload } from '../index';

export type GraphQLResolvers = {
  collections: {
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
