/* eslint-disable no-param-reassign */
import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import pluralize from 'pluralize'
const { singular } = pluralize

import type { GraphQLInfo } from 'payload/config'
import type { Field, SanitizedConfig, SanitizedGlobalConfig } from 'payload/types'

import { toWords } from 'payload/utilities'
import { buildVersionGlobalFields } from 'payload/versions'

import { docAccessResolver } from '../resolvers/globals/docAccess.js'
import findOneResolver from '../resolvers/globals/findOne.js'
import findVersionByIDResolver from '../resolvers/globals/findVersionByID.js'
import findVersionsResolver from '../resolvers/globals/findVersions.js'
import restoreVersionResolver from '../resolvers/globals/restoreVersion.js'
import updateResolver from '../resolvers/globals/update.js'
import formatName from '../utilities/formatName.js'
import { buildMutationInputType } from './buildMutationInputType.js'
import buildObjectType from './buildObjectType.js'
import buildPaginatedListType from './buildPaginatedListType.js'
import { buildPolicyType } from './buildPoliciesType.js'
import buildWhereInputType from './buildWhereInputType.js'

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
      config,
      fields,
      graphqlResult,
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
      resolve: findOneResolver(global),
    }

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
      resolve: updateResolver(global),
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

      graphqlResult.Query.fields[`version${formatName(formattedName)}`] = {
        type: graphqlResult.globals.graphQL[slug].versionType,
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
          sort: { type: GraphQLString },
        },
        resolve: findVersionsResolver(global),
      }
      graphqlResult.Mutation.fields[`restoreVersion${formatName(formattedName)}`] = {
        type: graphqlResult.globals.graphQL[slug].type,
        args: {
          id: { type: idType },
        },
        resolve: restoreVersionResolver(global),
      }
    }
  })
}

export default initGlobalsGraphQL
