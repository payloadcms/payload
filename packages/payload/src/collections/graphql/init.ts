/* eslint-disable no-param-reassign */
import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'

import type { Field } from '../../fields/config/types'
import type { ObjectTypeConfig } from '../../graphql/schema/buildObjectType'
import type { Payload } from '../../payload'
import type { Collection, SanitizedCollectionConfig } from '../config/types'

import forgotPassword from '../../auth/graphql/resolvers/forgotPassword'
import init from '../../auth/graphql/resolvers/init'
import login from '../../auth/graphql/resolvers/login'
import logout from '../../auth/graphql/resolvers/logout'
import me from '../../auth/graphql/resolvers/me'
import refresh from '../../auth/graphql/resolvers/refresh'
import resetPassword from '../../auth/graphql/resolvers/resetPassword'
import unlock from '../../auth/graphql/resolvers/unlock'
import verifyEmail from '../../auth/graphql/resolvers/verifyEmail'
import { fieldAffectsData } from '../../fields/config/types'
import buildMutationInputType, {
  getCollectionIDType,
} from '../../graphql/schema/buildMutationInputType'
import buildObjectType from '../../graphql/schema/buildObjectType'
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType'
import { buildPolicyType } from '../../graphql/schema/buildPoliciesType'
import buildWhereInputType from '../../graphql/schema/buildWhereInputType'
import formatName from '../../graphql/utilities/formatName'
import flattenFields from '../../utilities/flattenTopLevelFields'
import { formatNames, toWords } from '../../utilities/formatLabels'
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields'
import countResolver from './resolvers/count'
import createResolver from './resolvers/create'
import getDeleteResolver from './resolvers/delete'
import { docAccessResolver } from './resolvers/docAccess'
import findResolver from './resolvers/find'
import findByIDResolver from './resolvers/findByID'
import findVersionByIDResolver from './resolvers/findVersionByID'
import findVersionsResolver from './resolvers/findVersions'
import restoreVersionResolver from './resolvers/restoreVersion'
import updateResolver from './resolvers/update'

function initCollectionsGraphQL(payload: Payload): void {
  Object.keys(payload.collections).forEach((slug) => {
    const collection: Collection = payload.collections[slug]
    const {
      config,
      config: { fields, graphQL = {} as SanitizedCollectionConfig['graphQL'], versions },
    } = collection

    if (!graphQL) return

    const draftsEnabled = collection.config.versions?.drafts

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

    const hasIDField =
      flattenFields(fields).findIndex((field) => fieldAffectsData(field) && field.name === 'id') >
      -1

    const idType = getCollectionIDType(payload, config)

    const baseFields: ObjectTypeConfig = {}

    const whereInputFields = [...fields]

    if (!hasIDField) {
      baseFields.id = { type: idType }
      whereInputFields.push({
        name: 'id',
        type: payload.db.defaultIDType as 'text',
      })
    }

    const forceNullableObjectType = Boolean(versions?.drafts)

    collection.graphQL.type = buildObjectType({
      name: singularName,
      baseFields,
      fields,
      forceNullable: forceNullableObjectType,
      parentName: singularName,
      payload,
    })

    collection.graphQL.paginatedType = buildPaginatedListType(pluralName, collection.graphQL.type)

    collection.graphQL.whereInputType = buildWhereInputType({
      name: singularName,
      fields: whereInputFields,
      parentName: singularName,
      payload,
    })

    if (config.auth && !config.auth.disableLocalStrategy) {
      fields.push({
        name: 'password',
        type: 'text',
        label: 'Password',
        required: true,
      })
    }

    const createMutationInputType = buildMutationInputType(
      payload,
      singularName,
      fields,
      singularName,
    )
    if (createMutationInputType) {
      collection.graphQL.mutationInputType = new GraphQLNonNull(createMutationInputType)
    }

    const updateMutationInputType = buildMutationInputType(
      payload,
      `${singularName}Update`,
      fields.filter((field) => !(fieldAffectsData(field) && field.name === 'id')),
      `${singularName}Update`,
      true,
    )
    if (updateMutationInputType) {
      collection.graphQL.updateMutationInputType = new GraphQLNonNull(updateMutationInputType)
    }

    payload.Query.fields[singularName] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
        ...(draftsEnabled
          ? {
              draft: { type: GraphQLBoolean },
            }
          : {}),
        ...(payload.config.localization
          ? {
              fallbackLocale: { type: payload.types.fallbackLocaleInputType },
              locale: { type: payload.types.localeInputType },
            }
          : {}),
      },
      resolve: findByIDResolver(collection),
    }

    payload.Query.fields[pluralName] = {
      type: buildPaginatedListType(pluralName, collection.graphQL.type),
      args: {
        ...(draftsEnabled
          ? {
              draft: { type: GraphQLBoolean },
            }
          : {}),
        where: { type: collection.graphQL.whereInputType },
        ...(payload.config.localization
          ? {
              fallbackLocale: { type: payload.types.fallbackLocaleInputType },
              locale: { type: payload.types.localeInputType },
            }
          : {}),
        limit: { type: GraphQLInt },
        page: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
      resolve: findResolver(collection),
    }

    payload.Query.fields[`count${pluralName}`] = {
      type: new GraphQLObjectType({
        name: `count${pluralName}`,
        fields: {
          totalDocs: { type: GraphQLInt },
        },
      }),
      args: {
        ...(draftsEnabled
          ? {
              draft: { type: GraphQLBoolean },
            }
          : {}),
        where: { type: collection.graphQL.whereInputType },
        ...(payload.config.localization
          ? {
              locale: { type: payload.types.localeInputType },
            }
          : {}),
      },
      resolve: countResolver(collection),
    }

    payload.Query.fields[`docAccess${singularName}`] = {
      type: buildPolicyType({
        type: 'collection',
        entity: config,
        scope: 'docAccess',
        typeSuffix: 'DocAccess',
      }),
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: docAccessResolver(),
    }

    payload.Mutation.fields[`create${singularName}`] = {
      type: collection.graphQL.type,
      args: {
        ...(createMutationInputType
          ? { data: { type: collection.graphQL.mutationInputType } }
          : {}),
        ...(draftsEnabled
          ? {
              draft: { type: GraphQLBoolean },
            }
          : {}),
        ...(payload.config.localization
          ? {
              locale: { type: payload.types.localeInputType },
            }
          : {}),
      },
      resolve: createResolver(collection),
    }

    payload.Mutation.fields[`update${singularName}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
        autosave: { type: GraphQLBoolean },
        ...(updateMutationInputType
          ? { data: { type: collection.graphQL.updateMutationInputType } }
          : {}),
        ...(draftsEnabled
          ? {
              draft: { type: GraphQLBoolean },
            }
          : {}),
        ...(payload.config.localization
          ? {
              locale: { type: payload.types.localeInputType },
            }
          : {}),
      },
      resolve: updateResolver(collection),
    }

    payload.Mutation.fields[`delete${singularName}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: getDeleteResolver(collection),
    }

    if (config.versions) {
      const versionIDType = payload.db.defaultIDType === 'text' ? GraphQLString : GraphQLInt
      const versionCollectionFields: Field[] = [
        ...buildVersionCollectionFields(config),
        {
          name: 'id',
          type: payload.db.defaultIDType as 'text',
        },
        {
          name: 'createdAt',
          type: 'date',
          label: 'Created At',
        },
        {
          name: 'updatedAt',
          type: 'date',
          label: 'Updated At',
        },
      ]

      collection.graphQL.versionType = buildObjectType({
        name: `${singularName}Version`,
        fields: versionCollectionFields,
        forceNullable: forceNullableObjectType,
        parentName: `${singularName}Version`,
        payload,
      })

      payload.Query.fields[`version${formatName(singularName)}`] = {
        type: collection.graphQL.versionType,
        args: {
          id: { type: versionIDType },
          ...(payload.config.localization
            ? {
                fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                locale: { type: payload.types.localeInputType },
              }
            : {}),
        },
        resolve: findVersionByIDResolver(collection),
      }
      payload.Query.fields[`versions${pluralName}`] = {
        type: buildPaginatedListType(
          `versions${formatName(pluralName)}`,
          collection.graphQL.versionType,
        ),
        args: {
          where: {
            type: buildWhereInputType({
              name: `versions${singularName}`,
              fields: versionCollectionFields,
              parentName: `versions${singularName}`,
              payload,
            }),
          },
          ...(payload.config.localization
            ? {
                fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                locale: { type: payload.types.localeInputType },
              }
            : {}),
          limit: { type: GraphQLInt },
          page: { type: GraphQLInt },
          sort: { type: GraphQLString },
        },
        resolve: findVersionsResolver(collection),
      }
      payload.Mutation.fields[`restoreVersion${formatName(singularName)}`] = {
        type: collection.graphQL.type,
        args: {
          id: { type: versionIDType },
        },
        resolve: restoreVersionResolver(collection),
      }
    }

    if (config.auth) {
      const authFields: Field[] = config.auth.disableLocalStrategy
        ? []
        : [
            {
              name: 'email',
              type: 'email',
              required: true,
            },
          ]
      collection.graphQL.JWT = buildObjectType({
        name: formatName(`${slug}JWT`),
        fields: [
          ...config.fields.filter((field) => fieldAffectsData(field) && field.saveToJWT),
          ...authFields,
          {
            name: 'collection',
            type: 'text',
            required: true,
          },
        ],
        parentName: formatName(`${slug}JWT`),
        payload,
      })

      payload.Query.fields[`me${singularName}`] = {
        type: new GraphQLObjectType({
          name: formatName(`${slug}Me`),
          fields: {
            collection: {
              type: GraphQLString,
            },
            exp: {
              type: GraphQLInt,
            },
            strategy: {
              type: GraphQLString,
            },
            token: {
              type: GraphQLString,
            },
            user: {
              type: collection.graphQL.type,
            },
          },
        }),
        resolve: me(collection),
      }

      payload.Query.fields[`initialized${singularName}`] = {
        type: GraphQLBoolean,
        resolve: init(collection.config.slug),
      }

      payload.Mutation.fields[`refreshToken${singularName}`] = {
        type: new GraphQLObjectType({
          name: formatName(`${slug}Refreshed${singularName}`),
          fields: {
            exp: {
              type: GraphQLInt,
            },
            refreshedToken: {
              type: GraphQLString,
            },
            strategy: {
              type: GraphQLString,
            },
            user: {
              type: collection.graphQL.JWT,
            },
          },
        }),
        resolve: refresh(collection),
      }

      payload.Mutation.fields[`logout${singularName}`] = {
        type: GraphQLString,
        resolve: logout(collection),
      }

      if (!config.auth.disableLocalStrategy) {
        if (config.auth.maxLoginAttempts > 0) {
          payload.Mutation.fields[`unlock${singularName}`] = {
            type: new GraphQLNonNull(GraphQLBoolean),
            args: {
              email: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: unlock(collection),
          }
        }

        payload.Mutation.fields[`login${singularName}`] = {
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
          args: {
            email: { type: GraphQLString },
            password: { type: GraphQLString },
          },
          resolve: login(collection),
        }

        payload.Mutation.fields[`forgotPassword${singularName}`] = {
          type: new GraphQLNonNull(GraphQLBoolean),
          args: {
            disableEmail: { type: GraphQLBoolean },
            email: { type: new GraphQLNonNull(GraphQLString) },
            expiration: { type: GraphQLInt },
          },
          resolve: forgotPassword(collection),
        }

        payload.Mutation.fields[`resetPassword${singularName}`] = {
          type: new GraphQLObjectType({
            name: formatName(`${slug}ResetPassword`),
            fields: {
              token: { type: GraphQLString },
              user: { type: collection.graphQL.type },
            },
          }),
          args: {
            password: { type: GraphQLString },
            token: { type: GraphQLString },
          },
          resolve: resetPassword(collection),
        }

        payload.Mutation.fields[`verifyEmail${singularName}`] = {
          type: GraphQLBoolean,
          args: {
            token: { type: GraphQLString },
          },
          resolve: verifyEmail(collection),
        }
      }
    }
  })
}

export default initCollectionsGraphQL
