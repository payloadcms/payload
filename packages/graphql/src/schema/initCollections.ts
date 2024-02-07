/* eslint-disable no-param-reassign */
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import { formatNames, toWords } from 'payload/utilities'
import { fieldAffectsData } from 'payload/types'
import { buildVersionCollectionFields } from 'payload/versions'
import type { GraphQLInfo } from 'payload/config'
import type { Field, Collection, SanitizedCollectionConfig, SanitizedConfig } from 'payload/types'

import type { ObjectTypeConfig } from './buildObjectType'
import forgotPassword from '../resolvers/auth/forgotPassword'
import init from '../resolvers/auth/init'
import login from '../resolvers/auth/login'
import logout from '../resolvers/auth/logout'
import me from '../resolvers/auth/me'
import refresh from '../resolvers/auth/refresh'
import resetPassword from '../resolvers/auth/resetPassword'
import unlock from '../resolvers/auth/unlock'
import verifyEmail from '../resolvers/auth/verifyEmail'
import { buildMutationInputType, getCollectionIDType } from './buildMutationInputType'
import buildObjectType from './buildObjectType'
import buildPaginatedListType from './buildPaginatedListType'
import { buildPolicyType } from './buildPoliciesType'
import buildWhereInputType from './buildWhereInputType'
import formatName from '../utilities/formatName'
import createResolver from '../resolvers/collections/create'
import getDeleteResolver from '../resolvers/collections/delete'
import { docAccessResolver } from '../resolvers/collections/docAccess'
import findResolver from '../resolvers/collections/find'
import findByIDResolver from '../resolvers/collections/findByID'
import findVersionByIDResolver from '../resolvers/collections/findVersionByID'
import findVersionsResolver from '../resolvers/collections/findVersions'
import restoreVersionResolver from '../resolvers/collections/restoreVersion'
import updateResolver from '../resolvers/collections/update'

type InitCollectionsGraphQLArgs = {
  config: SanitizedConfig
  graphqlResult: GraphQLInfo
}
function initCollectionsGraphQL({ config, graphqlResult }: InitCollectionsGraphQLArgs): void {
  Object.keys(graphqlResult.collections).forEach((slug) => {
    const collection: Collection = graphqlResult.collections[slug]
    const {
      config: collectionConfig,
      config: { fields, graphQL = {} as SanitizedCollectionConfig['graphQL'], versions },
    } = collection

    if (!graphQL) return

    let singularName
    let pluralName
    const fromSlug = formatNames(collection.config.slug)
    if (graphQL.singularName) {
      singularName = toWords(graphQL.singularName, true)
    } else {
      singularName = fromSlug.singular
    }
    if (graphQL.pluralName) {
      pluralName = toWords(graphQL.pluralName, true)
    } else {
      pluralName = fromSlug.plural
    }

    // For collections named 'Media' or similar,
    // there is a possibility that the singular name
    // will equal the plural name. Append `all` to the beginning
    // of potential conflicts
    if (singularName === pluralName) {
      pluralName = `all${singularName}`
    }

    collection.graphQL = {} as Collection['graphQL']

    const idField = fields.find((field) => fieldAffectsData(field) && field.name === 'id')
    const idType = getCollectionIDType(config.db.defaultIDType, collectionConfig)

    const baseFields: ObjectTypeConfig = {}

    const whereInputFields = [...fields]

    if (!idField) {
      baseFields.id = { type: idType }
      whereInputFields.push({
        name: 'id',
        type: config.db.defaultIDType as 'text',
      })
    }

    const forceNullableObjectType = Boolean(versions?.drafts)

    collection.graphQL.type = buildObjectType({
      name: singularName,
      baseFields,
      fields,
      forceNullable: forceNullableObjectType,
      parentName: singularName,
      graphqlResult,
      config,
    })

    collection.graphQL.paginatedType = buildPaginatedListType(pluralName, collection.graphQL.type)

    collection.graphQL.whereInputType = buildWhereInputType({
      name: singularName,
      fields: whereInputFields,
      parentName: singularName,
    })

    if (collectionConfig.auth && !collectionConfig.auth.disableLocalStrategy) {
      fields.push({
        name: 'password',
        label: 'Password',
        required: true,
        type: 'text',
      })
    }

    const createMutationInputType = buildMutationInputType({
      name: singularName,
      fields,
      parentName: singularName,
      graphqlResult,
      config,
    })
    if (createMutationInputType) {
      collection.graphQL.mutationInputType = new GraphQLNonNull(createMutationInputType)
    }

    const updateMutationInputType = buildMutationInputType({
      name: `${singularName}Update`,
      fields: fields.filter((field) => !(fieldAffectsData(field) && field.name === 'id')),
      parentName: `${singularName}Update`,
      forceNullable: true,
      graphqlResult,
      config,
    })
    if (updateMutationInputType) {
      collection.graphQL.updateMutationInputType = new GraphQLNonNull(updateMutationInputType)
    }

    graphqlResult.Query.fields[singularName] = {
      args: {
        id: { type: new GraphQLNonNull(idType) },
        draft: { type: GraphQLBoolean },
        ...(config.localization
          ? {
              fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
              locale: { type: graphqlResult.types.localeInputType },
            }
          : {}),
      },
      resolve: findByIDResolver(collection),
      type: collection.graphQL.type,
    }

    graphqlResult.Query.fields[pluralName] = {
      args: {
        draft: { type: GraphQLBoolean },
        where: { type: collection.graphQL.whereInputType },
        ...(config.localization
          ? {
              fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
              locale: { type: graphqlResult.types.localeInputType },
            }
          : {}),
        limit: { type: GraphQLInt },
        page: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
      resolve: findResolver(collection),
      type: buildPaginatedListType(pluralName, collection.graphQL.type),
    }

    graphqlResult.Query.fields[`docAccess${singularName}`] = {
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: docAccessResolver(collection),
      type: buildPolicyType({
        entity: collectionConfig,
        scope: 'docAccess',
        type: 'collection',
        typeSuffix: 'DocAccess',
      }),
    }

    graphqlResult.Mutation.fields[`create${singularName}`] = {
      args: {
        ...(createMutationInputType
          ? { data: { type: collection.graphQL.mutationInputType } }
          : {}),
        draft: { type: GraphQLBoolean },
        ...(config.localization
          ? {
              locale: { type: graphqlResult.types.localeInputType },
            }
          : {}),
      },
      resolve: createResolver(collection),
      type: collection.graphQL.type,
    }

    graphqlResult.Mutation.fields[`update${singularName}`] = {
      args: {
        id: { type: new GraphQLNonNull(idType) },
        autosave: { type: GraphQLBoolean },
        ...(updateMutationInputType
          ? { data: { type: collection.graphQL.updateMutationInputType } }
          : {}),
        draft: { type: GraphQLBoolean },
        ...(config.localization
          ? {
              locale: { type: graphqlResult.types.localeInputType },
            }
          : {}),
      },
      resolve: updateResolver(collection),
      type: collection.graphQL.type,
    }

    graphqlResult.Mutation.fields[`delete${singularName}`] = {
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: getDeleteResolver(collection),
      type: collection.graphQL.type,
    }

    if (collectionConfig.versions) {
      const versionIDType = config.db.defaultIDType === 'text' ? GraphQLString : GraphQLInt
      const versionCollectionFields: Field[] = [
        ...buildVersionCollectionFields(collectionConfig),
        {
          name: 'id',
          type: config.db.defaultIDType as 'text',
        },
        {
          name: 'createdAt',
          label: 'Created At',
          type: 'date',
        },
        {
          name: 'updatedAt',
          label: 'Updated At',
          type: 'date',
        },
      ]

      collection.graphQL.versionType = buildObjectType({
        name: `${singularName}Version`,
        fields: versionCollectionFields,
        forceNullable: forceNullableObjectType,
        parentName: `${singularName}Version`,
        graphqlResult,
        config,
      })

      graphqlResult.Query.fields[`version${formatName(singularName)}`] = {
        args: {
          id: { type: versionIDType },
          ...(config.localization
            ? {
                fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
                locale: { type: graphqlResult.types.localeInputType },
              }
            : {}),
        },
        resolve: findVersionByIDResolver(collection),
        type: collection.graphQL.versionType,
      }
      graphqlResult.Query.fields[`versions${pluralName}`] = {
        args: {
          where: {
            type: buildWhereInputType({
              name: `versions${singularName}`,
              fields: versionCollectionFields,
              parentName: `versions${singularName}`,
            }),
          },
          ...(config.localization
            ? {
                fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
                locale: { type: graphqlResult.types.localeInputType },
              }
            : {}),
          limit: { type: GraphQLInt },
          page: { type: GraphQLInt },
          sort: { type: GraphQLString },
        },
        resolve: findVersionsResolver(collection),
        type: buildPaginatedListType(
          `versions${formatName(pluralName)}`,
          collection.graphQL.versionType,
        ),
      }
      graphqlResult.Mutation.fields[`restoreVersion${formatName(singularName)}`] = {
        args: {
          id: { type: versionIDType },
        },
        resolve: restoreVersionResolver(collection),
        type: collection.graphQL.type,
      }
    }

    if (collectionConfig.auth) {
      const authFields: Field[] = collectionConfig.auth.disableLocalStrategy
        ? []
        : [
            {
              name: 'email',
              required: true,
              type: 'email',
            },
          ]
      collection.graphQL.JWT = buildObjectType({
        name: formatName(`${slug}JWT`),
        fields: [
          ...collectionConfig.fields.filter((field) => fieldAffectsData(field) && field.saveToJWT),
          ...authFields,
          {
            name: 'collection',
            required: true,
            type: 'text',
          },
        ],
        parentName: formatName(`${slug}JWT`),
        graphqlResult,
        config,
      })

      graphqlResult.Query.fields[`me${singularName}`] = {
        resolve: me(collection),
        type: new GraphQLObjectType({
          name: formatName(`${slug}Me`),
          fields: {
            collection: {
              type: GraphQLString,
            },
            exp: {
              type: GraphQLInt,
            },
            token: {
              type: GraphQLString,
            },
            user: {
              type: collection.graphQL.type,
            },
          },
        }),
      }

      graphqlResult.Query.fields[`initialized${singularName}`] = {
        resolve: init(collection.config.slug),
        type: GraphQLBoolean,
      }

      graphqlResult.Mutation.fields[`refreshToken${singularName}`] = {
        args: {
          token: { type: GraphQLString },
        },
        resolve: refresh(collection),
        type: new GraphQLObjectType({
          name: formatName(`${slug}Refreshed${singularName}`),
          fields: {
            exp: {
              type: GraphQLInt,
            },
            refreshedToken: {
              type: GraphQLString,
            },
            user: {
              type: collection.graphQL.JWT,
            },
          },
        }),
      }

      graphqlResult.Mutation.fields[`logout${singularName}`] = {
        resolve: logout(collection),
        type: GraphQLString,
      }

      if (!collectionConfig.auth.disableLocalStrategy) {
        if (collectionConfig.auth.maxLoginAttempts > 0) {
          graphqlResult.Mutation.fields[`unlock${singularName}`] = {
            args: {
              email: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: unlock(collection),
            type: new GraphQLNonNull(GraphQLBoolean),
          }
        }

        graphqlResult.Mutation.fields[`login${singularName}`] = {
          args: {
            email: { type: GraphQLString },
            password: { type: GraphQLString },
          },
          resolve: login(collection),
          type: new GraphQLObjectType({
            name: formatName(`${slug}LoginResult`),
            fields: {
              exp: {
                type: GraphQLInt,
              },
              token: {
                type: GraphQLString,
              },
              user: {
                type: collection.graphQL.type,
              },
            },
          }),
        }

        graphqlResult.Mutation.fields[`forgotPassword${singularName}`] = {
          args: {
            disableEmail: { type: GraphQLBoolean },
            email: { type: new GraphQLNonNull(GraphQLString) },
            expiration: { type: GraphQLInt },
          },
          resolve: forgotPassword(collection),
          type: new GraphQLNonNull(GraphQLBoolean),
        }

        graphqlResult.Mutation.fields[`resetPassword${singularName}`] = {
          args: {
            password: { type: GraphQLString },
            token: { type: GraphQLString },
          },
          resolve: resetPassword(collection),
          type: new GraphQLObjectType({
            name: formatName(`${slug}ResetPassword`),
            fields: {
              token: { type: GraphQLString },
              user: { type: collection.graphQL.type },
            },
          }),
        }

        graphqlResult.Mutation.fields[`verifyEmail${singularName}`] = {
          args: {
            token: { type: GraphQLString },
          },
          resolve: verifyEmail(collection),
          type: GraphQLBoolean,
        }
      }
    }
  })
}

export default initCollectionsGraphQL
