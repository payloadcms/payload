import path from 'path'
import type { Config } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'
import type { CollectionBeforeReadHook } from 'payload/types'

import type { PasswordProtectionConfig } from './types'
import getCookiePrefix from './utilities/getCookiePrefix'
import getMutation from './utilities/getMutation'
import getRouter from './utilities/getRouter'
import parseCookies from './utilities/parseCookies'

const collectionPasswords =
  (incomingOptions: PasswordProtectionConfig) =>
  (incomingConfig: Config): Config => {
    const { collections } = incomingOptions

    const options = {
      collections,
      routePath: incomingOptions.routePath || '/validate-password',
      expiration: incomingOptions.expiration || 7200,
      whitelistUsers:
        incomingOptions.whitelistUsers ||
        (({ payloadAPI, user }) => Boolean(user) || payloadAPI === 'local'),
      passwordFieldName: incomingOptions.passwordFieldName || 'docPassword',
      passwordProtectedFieldName: incomingOptions.passwordFieldName || 'passwordProtected',
      mutationName: incomingOptions.mutationName || 'validatePassword',
    }

    const config: Config = {
      ...incomingConfig,
      graphQL: {
        ...incomingConfig.graphQL,
        mutations: (GraphQL, payload) => ({
          ...(typeof incomingConfig?.graphQL?.mutations === 'function'
            ? incomingConfig.graphQL.mutations(GraphQL, payload)
            : {}),
          [options.mutationName]: getMutation(GraphQL, payload, incomingConfig, options),
        }),
      },
      express: {
        ...incomingConfig?.express,
        middleware: [
          ...(incomingConfig?.express?.middleware || []),
          getRouter(incomingConfig, options),
        ],
      },
      admin: {
        ...incomingConfig.admin,
        webpack: webpackConfig => {
          let newWebpackConfig = { ...webpackConfig }
          if (typeof incomingConfig?.admin?.webpack === 'function')
            newWebpackConfig = incomingConfig.admin.webpack(webpackConfig)

          const webpackMock = path.resolve(__dirname, './utilities/webpackMock.js')

          return {
            ...newWebpackConfig,
            resolve: {
              ...newWebpackConfig.resolve,
              alias: {
                ...(newWebpackConfig?.resolve?.alias || {}),
                [path.resolve(__dirname, 'utilities/getRouter')]: webpackMock,
                [path.resolve(__dirname, 'utilities/getMutation')]: webpackMock,
              },
            },
          }
        },
      },
    }

    config.collections =
      config?.collections?.map(collectionConfig => {
        if (collections?.includes(collectionConfig.slug)) {
          const cookiePrefix = getCookiePrefix(config.cookiePrefix || '', collectionConfig.slug)

          const beforeReadHook: CollectionBeforeReadHook = async ({ req, doc }) => {
            const whitelistUsersResponse =
              typeof options.whitelistUsers === 'function'
                ? await options.whitelistUsers(req)
                : false

            if (!doc[options.passwordFieldName] || whitelistUsersResponse) return doc

            const cookies = parseCookies(req)
            const cookiePassword = cookies[`${cookiePrefix}-${doc.id}`]

            if (cookiePassword === doc[options.passwordFieldName]) {
              return doc
            }

            return {
              id: doc.id,
              [options.passwordProtectedFieldName]: true,
            }
          }

          const collectionWithPasswordProtection: CollectionConfig = {
            ...collectionConfig,
            hooks: {
              ...collectionConfig?.hooks,
              beforeRead: [...(collectionConfig?.hooks?.beforeRead || []), beforeReadHook],
            },
            fields: [
              ...collectionConfig?.fields.map(field => {
                const newField = { ...field }
                newField.admin = {
                  ...newField.admin,
                  condition: (data, siblingData) => {
                    const existingConditionResult = field?.admin?.condition
                      ? field.admin.condition(data, siblingData)
                      : true
                    return data?.[options.passwordProtectedFieldName]
                      ? false
                      : existingConditionResult
                  },
                }

                return newField
              }),
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
                  beforeChange: [({ value }) => (value ? null : undefined)],
                },
                admin: {
                  disabled: true,
                },
              },
            ],
          }

          return collectionWithPasswordProtection
        }

        return collectionConfig
      }) || []

    return config
  }

export default collectionPasswords
