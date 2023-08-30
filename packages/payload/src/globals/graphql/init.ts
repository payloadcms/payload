/* eslint-disable no-param-reassign */
import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLString } from 'graphql'
import pluralize from 'pluralize-esm'

import type { Field } from '../../fields/config/types.js'
import type { Payload } from '../../payload.js'
import type { SanitizedGlobalConfig } from '../config/types.js'

import buildMutationInputType from '../../graphql/schema/buildMutationInputType.js'
import buildObjectType from '../../graphql/schema/buildObjectType.js'
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType.js'
import { buildPolicyType } from '../../graphql/schema/buildPoliciesType.js'
import buildWhereInputType from '../../graphql/schema/buildWhereInputType.js'
import formatName from '../../graphql/utilities/formatName.js'
import { toWords } from '../../utilities/formatLabels.js'
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields.js'
import { docAccessResolver } from './resolvers/docAccess.js'
import findOneResolver from './resolvers/findOne.js'
import findVersionByIDResolver from './resolvers/findVersionByID.js'
import findVersionsResolver from './resolvers/findVersions.js'
import restoreVersionResolver from './resolvers/restoreVersion.js'
import updateResolver from './resolvers/update.js'

const { singular } = pluralize

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

    payload.globals.graphQL[slug] = {
      mutationInputType: new GraphQLNonNull(
        buildMutationInputType(payload, formattedName, fields, formattedName),
      ),
      type: buildObjectType({
        fields,
        forceNullable: forceNullableObjectType,
        name: formattedName,
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
        data: { type: payload.globals.graphQL[slug].mutationInputType },
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
      const versionGlobalFields: Field[] = [
        ...buildVersionGlobalFields(global),
        {
          name: 'id',
          type: 'text',
        },
        {
          label: 'Created At',
          name: 'createdAt',
          type: 'date',
        },
        {
          label: 'Updated At',
          name: 'updatedAt',
          type: 'date',
        },
      ]

      payload.globals.graphQL[slug].versionType = buildObjectType({
        fields: versionGlobalFields,
        forceNullable: forceNullableObjectType,
        name: `${formattedName}Version`,
        parentName: `${formattedName}Version`,
        payload,
      })

      payload.Query.fields[`version${formatName(formattedName)}`] = {
        args: {
          id: { type: GraphQLString },
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
            type: buildWhereInputType(
              `versions${formattedName}`,
              versionGlobalFields,
              `versions${formattedName}`,
            ),
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
          id: { type: GraphQLString },
        },
        resolve: restoreVersionResolver(global),
        type: payload.globals.graphQL[slug].type,
      }
    }
  })
}

export default initGlobalsGraphQL
