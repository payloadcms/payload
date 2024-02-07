/* eslint-disable no-param-reassign */
import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import { singular } from 'pluralize'
import { toWords } from 'payload/utilities'
import { buildVersionGlobalFields } from 'payload/versions'

import type { GraphQLInfo } from 'payload/config'
import type { Field, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'

import { buildMutationInputType } from './schema/buildMutationInputType'
import buildObjectType from './schema/buildObjectType'
import buildPaginatedListType from './schema/buildPaginatedListType'
import { buildPolicyType } from './schema/buildPoliciesType'
import buildWhereInputType from './schema/buildWhereInputType'
import formatName from './utilities/formatName'
import { docAccessResolver } from './resolvers/globals/docAccess'
import findOneResolver from './resolvers/globals/findOne'
import findVersionByIDResolver from './resolvers/globals/findVersionByID'
import findVersionsResolver from './resolvers/globals/findVersions'
import restoreVersionResolver from './resolvers/globals/restoreVersion'
import updateResolver from './resolvers/globals/update'

type InitGlobalsGraphQLArgs = {
  config: SanitizedConfig
  graphqlResult: GraphQLInfo
}
function initGlobalsGraphQL({ config, graphqlResult }: InitGlobalsGraphQLArgs): void {
  Object.keys(graphqlResult.globals.config).forEach((slug) => {
    const global: SanitizedGlobalConfig = graphqlResult.globals.config[slug]
    const { fields, graphQL, versions } = global

    if (graphQL === false) {
      return
    }

    const formattedName = graphQL?.name ? graphQL.name : singular(toWords(global.slug, true))

    const forceNullableObjectType = Boolean(versions?.drafts)

    if (!graphqlResult.globals.graphQL) graphqlResult.globals.graphQL = {}

    const updateMutationInputType = buildMutationInputType({
      name: formattedName,
      fields,
      parentName: formattedName,
      graphqlResult,
      config,
    })
    graphqlResult.globals.graphQL[slug] = {
      mutationInputType: updateMutationInputType
        ? new GraphQLNonNull(updateMutationInputType)
        : null,
      type: buildObjectType({
        name: formattedName,
        fields,
        forceNullable: forceNullableObjectType,
        parentName: formattedName,
        graphqlResult,
        config,
      }),
    }

    graphqlResult.Query.fields[formattedName] = {
      args: {
        draft: { type: GraphQLBoolean },
        ...(config.localization
          ? {
              fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
              locale: { type: graphqlResult.types.localeInputType },
            }
          : {}),
      },
      resolve: findOneResolver(global),
      type: graphqlResult.globals.graphQL[slug].type,
    }

    graphqlResult.Mutation.fields[`update${formattedName}`] = {
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
      resolve: updateResolver(global),
      type: graphqlResult.globals.graphQL[slug].type,
    }

    graphqlResult.Query.fields[`docAccess${formattedName}`] = {
      resolve: docAccessResolver(global),
      type: buildPolicyType({
        entity: global,
        scope: 'docAccess',
        type: 'global',
        typeSuffix: 'DocAccess',
      }),
    }

    if (global.versions) {
      const idType = config.db.defaultIDType === 'number' ? GraphQLInt : GraphQLString

      const versionGlobalFields: Field[] = [
        ...buildVersionGlobalFields(global),
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

      graphqlResult.globals.graphQL[slug].versionType = buildObjectType({
        name: `${formattedName}Version`,
        fields: versionGlobalFields,
        forceNullable: forceNullableObjectType,
        parentName: `${formattedName}Version`,
        graphqlResult,
        config,
      })

      graphqlResult.Query.fields[`version${formatName(formattedName)}`] = {
        args: {
          id: { type: idType },
          ...(config.localization
            ? {
                fallbackLocale: { type: graphqlResult.types.fallbackLocaleInputType },
                locale: { type: graphqlResult.types.localeInputType },
              }
            : {}),
        },
        resolve: findVersionByIDResolver(global),
        type: graphqlResult.globals.graphQL[slug].versionType,
      }
      graphqlResult.Query.fields[`versions${formattedName}`] = {
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
          sort: { type: GraphQLString },
        },
        resolve: findVersionsResolver(global),
        type: buildPaginatedListType(
          `versions${formatName(formattedName)}`,
          graphqlResult.globals.graphQL[slug].versionType,
        ),
      }
      graphqlResult.Mutation.fields[`restoreVersion${formatName(formattedName)}`] = {
        args: {
          id: { type: idType },
        },
        resolve: restoreVersionResolver(global),
        type: graphqlResult.globals.graphQL[slug].type,
      }
    }
  })
}

export default initGlobalsGraphQL
