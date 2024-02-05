/* eslint-disable no-param-reassign */
import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import { singular } from 'pluralize'
import { toWords } from 'payload/utilities'
import { buildVersionGlobalFields } from 'payload/versions'

import type { Payload } from 'payload'
import type { Field, SanitizedGlobalConfig } from 'payload/types'

import buildMutationInputType from './schema/buildMutationInputType'
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

function initGlobalsGraphQL(payload: Payload): void {
  Object.keys(payload.globals.config).forEach((slug) => {
    const global: SanitizedGlobalConfig = payload.globals.config[slug]
    const { fields, graphQL, versions } = global

    if (graphQL === false) {
      return
    }

    const formattedName = graphQL?.name ? graphQL.name : singular(toWords(global.slug, true))

    const forceNullableObjectType = Boolean(versions?.drafts)

    if (!payload.globals.graphQL) payload.globals.graphQL = {}

    const updateMutationInputType = buildMutationInputType(
      payload,
      formattedName,
      fields,
      formattedName,
    )
    payload.globals.graphQL[slug] = {
      mutationInputType: updateMutationInputType
        ? new GraphQLNonNull(updateMutationInputType)
        : null,
      type: buildObjectType({
        name: formattedName,
        fields,
        forceNullable: forceNullableObjectType,
        parentName: formattedName,
        payload,
      }),
    }

    payload.Query.fields[formattedName] = {
      args: {
        draft: { type: GraphQLBoolean },
        ...(payload.config.localization
          ? {
              fallbackLocale: { type: payload.types.fallbackLocaleInputType },
              locale: { type: payload.types.localeInputType },
            }
          : {}),
      },
      resolve: findOneResolver(global),
      type: payload.globals.graphQL[slug].type,
    }

    payload.Mutation.fields[`update${formattedName}`] = {
      args: {
        ...(updateMutationInputType
          ? { data: { type: payload.globals.graphQL[slug].mutationInputType } }
          : {}),
        draft: { type: GraphQLBoolean },
        ...(payload.config.localization
          ? {
              locale: { type: payload.types.localeInputType },
            }
          : {}),
      },
      resolve: updateResolver(global),
      type: payload.globals.graphQL[slug].type,
    }

    payload.Query.fields[`docAccess${formattedName}`] = {
      resolve: docAccessResolver(global),
      type: buildPolicyType({
        entity: global,
        scope: 'docAccess',
        type: 'global',
        typeSuffix: 'DocAccess',
      }),
    }

    if (global.versions) {
      const idType = payload.db.defaultIDType === 'number' ? GraphQLInt : GraphQLString

      const versionGlobalFields: Field[] = [
        ...buildVersionGlobalFields(global),
        {
          name: 'id',
          type: payload.db.defaultIDType as 'text',
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

      payload.globals.graphQL[slug].versionType = buildObjectType({
        name: `${formattedName}Version`,
        fields: versionGlobalFields,
        forceNullable: forceNullableObjectType,
        parentName: `${formattedName}Version`,
        payload,
      })

      payload.Query.fields[`version${formatName(formattedName)}`] = {
        args: {
          id: { type: idType },
          ...(payload.config.localization
            ? {
                fallbackLocale: { type: payload.types.fallbackLocaleInputType },
                locale: { type: payload.types.localeInputType },
              }
            : {}),
        },
        resolve: findVersionByIDResolver(global),
        type: payload.globals.graphQL[slug].versionType,
      }
      payload.Query.fields[`versions${formattedName}`] = {
        args: {
          where: {
            type: buildWhereInputType({
              name: `versions${formattedName}`,
              fields: versionGlobalFields,
              parentName: `versions${formattedName}`,
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
        resolve: findVersionsResolver(global),
        type: buildPaginatedListType(
          `versions${formatName(formattedName)}`,
          payload.globals.graphQL[slug].versionType,
        ),
      }
      payload.Mutation.fields[`restoreVersion${formatName(formattedName)}`] = {
        args: {
          id: { type: idType },
        },
        resolve: restoreVersionResolver(global),
        type: payload.globals.graphQL[slug].type,
      }
    }
  })
}

export default initGlobalsGraphQL
