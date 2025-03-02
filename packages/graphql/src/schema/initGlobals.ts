import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import pluralize from 'pluralize'
const { singular } = pluralize

import type { Field, GraphQLInfo, SanitizedConfig, SanitizedGlobalConfig } from 'payload'

import { buildVersionGlobalFields, toWords } from 'payload'

import { docAccessResolver } from '../resolvers/globals/docAccess.js'
import { findOne } from '../resolvers/globals/findOne.js'
import { findVersionByID } from '../resolvers/globals/findVersionByID.js'
import { findVersions } from '../resolvers/globals/findVersions.js'
import { restoreVersion } from '../resolvers/globals/restoreVersion.js'
import { update } from '../resolvers/globals/update.js'
import { formatName } from '../utilities/formatName.js'
import { buildMutationInputType } from './buildMutationInputType.js'
import { buildObjectType } from './buildObjectType.js'
import { buildPaginatedListType } from './buildPaginatedListType.js'
import { buildPolicyType } from './buildPoliciesType.js'
import { buildWhereInputType } from './buildWhereInputType.js'

type InitGlobalsGraphQLArgs = {
  config: SanitizedConfig
  graphqlResult: GraphQLInfo
}
export function initGlobals({ config, graphqlResult }: InitGlobalsGraphQLArgs): void {
  Object.keys(graphqlResult.globals.config).forEach((slug) => {
    const global: SanitizedGlobalConfig = graphqlResult.globals.config[slug]
    const { fields, graphQL, versions } = global

    if (graphQL === false) {
      return
    }

    const formattedName = graphQL?.name ? graphQL.name : singular(toWords(global.slug, true))

    const forceNullableObjectType = Boolean(versions?.drafts)

    if (!graphqlResult.globals.graphQL) {
      graphqlResult.globals.graphQL = {}
    }

    const updateMutationInputType = buildMutationInputType({
      name: formattedName,
      config,
      fields,
      graphqlResult,
      parentIsLocalized: false,
      parentName: formattedName,
    })
    graphqlResult.globals.graphQL[slug] = {
      type: buildObjectType({
        name: formattedName,
        config,
        fields,
        forceNullable: forceNullableObjectType,
        graphqlResult,
        parentName: formattedName,
      }),
      mutationInputType: updateMutationInputType
        ? new GraphQLNonNull(updateMutationInputType)
        : null,
    }

    const queriesEnabled = typeof global.graphQL !== 'object' || !global.graphQL.disableQueries
    const mutationsEnabled = typeof global.graphQL !== 'object' || !global.graphQL.disableMutations

    if (queriesEnabled) {
      graphqlResult.Query.fields[formattedName] = {
        type: graphqlResult.globals.graphQL[slug].type,
        args: {
          draft: { type: GraphQLBoolean },
          ...(config.localization
            ? {
                fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
                locale: { type: graphqlResult.types.localeInputType },
              }
            : {}),
        },
        resolve: findOne(global),
      }

      graphqlResult.Query.fields[`docAccess${formattedName}`] = {
        type: buildPolicyType({
          type: 'global',
          entity: global,
          scope: 'docAccess',
          typeSuffix: 'DocAccess',
        }),
        resolve: docAccessResolver(global),
      }
    }

    if (mutationsEnabled) {
      graphqlResult.Mutation.fields[`update${formattedName}`] = {
        type: graphqlResult.globals.graphQL[slug].type,
        args: {
          ...(updateMutationInputType
            ? { data: { type: graphqlResult.globals.graphQL[slug].mutationInputType } }
            : {}),
          draft: { type: GraphQLBoolean },
          ...(config.localization
            ? {
                locale: { type: graphqlResult.types.localeInputType },
              }
            : {}),
        },
        resolve: update(global),
      }
    }

    if (global.versions) {
      const idType = config.db.defaultIDType === 'number' ? GraphQLInt : GraphQLString

      const versionGlobalFields: Field[] = [
        ...buildVersionGlobalFields(config, global),
        {
          name: 'id',
          type: config.db.defaultIDType as 'text',
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

      graphqlResult.globals.graphQL[slug].versionType = buildObjectType({
        name: `${formattedName}Version`,
        config,
        fields: versionGlobalFields,
        forceNullable: forceNullableObjectType,
        graphqlResult,
        parentName: `${formattedName}Version`,
      })

      if (queriesEnabled) {
        graphqlResult.Query.fields[`version${formatName(formattedName)}`] = {
          type: graphqlResult.globals.graphQL[slug].versionType,
          args: {
            id: { type: idType },
            draft: { type: GraphQLBoolean },
            ...(config.localization
              ? {
                  fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
                  locale: { type: graphqlResult.types.localeInputType },
                }
              : {}),
          },
          resolve: findVersionByID(global),
        }
        graphqlResult.Query.fields[`versions${formattedName}`] = {
          type: buildPaginatedListType(
            `versions${formatName(formattedName)}`,
            graphqlResult.globals.graphQL[slug].versionType,
          ),
          args: {
            where: {
              type: buildWhereInputType({
                name: `versions${formattedName}`,
                fields: versionGlobalFields,
                parentName: `versions${formattedName}`,
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
            pagination: { type: GraphQLBoolean },
            sort: { type: GraphQLString },
          },
          resolve: findVersions(global),
        }
      }

      if (mutationsEnabled) {
        graphqlResult.Mutation.fields[`restoreVersion${formatName(formattedName)}`] = {
          type: graphqlResult.globals.graphQL[slug].type,
          args: {
            id: { type: idType },
            draft: { type: GraphQLBoolean },
          },
          resolve: restoreVersion(global),
        }
      }
    }
  })
}
