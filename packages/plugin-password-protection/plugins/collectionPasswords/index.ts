import path from 'path';
import { Config } from 'payload/config';
import { CollectionConfig } from 'payload/dist/collections/config/types';
import { CollectionBeforeReadHook } from 'payload/types';
import { Options } from './types';
import parseCookies from './parseCookies';
import getRouter from './getRouter';
import getMutation from './getMutation';
import getCookiePrefix from './getCookiePrefix';

const collectionPasswords = (incomingOptions: Options) => (incomingConfig: Config): Config => {
  const {
    slugs,
  } = incomingOptions;

  const options = {
    slugs,
    routePath: incomingOptions.routePath || '/validate-password',
    expiration: incomingOptions.expiration || 7200,
    whitelistUsers: incomingOptions.whitelistUsers || (({ payloadAPI, user }) => Boolean(user) || payloadAPI === 'local'),
    passwordFieldName: incomingOptions.passwordFieldName || 'docPassword',
    passwordProtectedFieldName: incomingOptions.passwordFieldName || 'passwordProtected',
    mutationName: incomingOptions.mutationName || 'ValidatePassword',
  };

  const config: Config = {
    ...incomingConfig,
    graphQL: {
      ...incomingConfig.graphQL,
      mutations: (GraphQL, payload) => ({
        ...(typeof incomingConfig.graphQL.mutations === 'function' ? incomingConfig.graphQL.mutations(GraphQL, payload) : {}),
        [options.mutationName]: getMutation(GraphQL, payload, incomingConfig, options),
      }),
    },
    express: {
      ...incomingConfig?.express,
      middleware: [
        ...incomingConfig?.express?.middleware || [],
        getRouter(incomingConfig, options),
      ],
    },
    admin: {
      ...incomingConfig.admin,
      webpack: (webpackConfig) => {
        let newWebpackConfig = { ...webpackConfig };
        if (typeof incomingConfig?.admin?.webpack === 'function') newWebpackConfig = incomingConfig.admin.webpack(webpackConfig);

        const webpackMock = path.resolve(__dirname, './webpackMock.js');

        return {
          ...newWebpackConfig,
          resolve: {
            ...newWebpackConfig.resolve,
            alias: {
              ...newWebpackConfig.resolve.alias,
              [path.resolve(__dirname, 'getRouter')]: webpackMock,
              [path.resolve(__dirname, 'getMutation')]: webpackMock,
            },
          },
        };
      },
    },
  };

  config.collections = config.collections.map((collectionConfig) => {
    if (slugs.includes(collectionConfig.slug)) {
      const cookiePrefix = getCookiePrefix(config.cookiePrefix, collectionConfig.slug);

      const beforeReadHook: CollectionBeforeReadHook = async ({ req, doc }) => {
        const whitelistUsersResponse = typeof options.whitelistUsers === 'function' ? await options.whitelistUsers(req) : false;

        if (!doc[options.passwordFieldName] || whitelistUsersResponse) return doc;

        const cookies = parseCookies(req);
        const cookiePagePassword = cookies[`${cookiePrefix}-${doc.id}`];

        if (cookiePagePassword === doc[options.passwordFieldName]) {
          return doc;
        }

        return {
          id: doc.id,
          [options.passwordProtectedFieldName]: true,
        };
      };

      const collectionWithPasswordProtection: CollectionConfig = {
        ...collectionConfig,
        hooks: {
          ...collectionConfig?.hooks,
          beforeRead: [
            ...collectionConfig?.hooks?.beforeRead || [],
            beforeReadHook,
          ],
        },
        fields: [
          ...collectionConfig?.fields,
          {
            name: options.passwordFieldName,
            label: 'Password',
            type: 'text',
            admin: {
              position: 'sidebar',
            },
          },
          {
            name: options.passwordProtectedFieldName,
            type: 'checkbox',
            hooks: {
              beforeChange: [
                ({ value }) => (value ? null : undefined),
              ],
            },
            admin: {
              disabled: true,
            },
          },
        ],
      };

      return collectionWithPasswordProtection;
    }

    return collectionConfig;
  });

  return config;
};

export default collectionPasswords;
