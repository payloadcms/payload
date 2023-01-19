/* eslint-disable no-param-reassign */
import { GraphQLNonNull, GraphQLBoolean, GraphQLInt, GraphQLString } from 'graphql';
import { singular } from 'pluralize';
import formatName from '../../graphql/utilities/formatName';
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';
import findOneResolver from './resolvers/findOne';
import updateResolver from './resolvers/update';
import findVersionByIDResolver from './resolvers/findVersionByID';
import findVersionsResolver from './resolvers/findVersions';
import restoreVersionResolver from './resolvers/restoreVersion';
import { Payload } from '../../payload';
import buildObjectType from '../../graphql/schema/buildObjectType';
import buildMutationInputType from '../../graphql/schema/buildMutationInputType';
import buildWhereInputType from '../../graphql/schema/buildWhereInputType';
import { Field } from '../../fields/config/types';
import { toWords } from '../../utilities/formatLabels';
import { SanitizedGlobalConfig } from '../config/types';
import { buildPolicyType } from '../../graphql/schema/buildPoliciesType';
import { docAccessResolver } from './resolvers/docAccess';

function initGlobalsGraphQL(payload: Payload): void {
  if (payload.config.globals) {
    Object.keys(payload.globals.config).forEach((slug) => {
      const global: SanitizedGlobalConfig = payload.globals.config[slug];
      const {
        fields,
        versions,
      } = global;

      const formattedName = global.graphQL?.name ? global.graphQL.name : singular(toWords(global.slug, true));

      const forceNullableObjectType = Boolean(versions?.drafts);

      if (!payload.globals.graphQL) payload.globals.graphQL = {};

      payload.globals.graphQL[slug] = {
        type: buildObjectType({
          payload,
          name: formattedName,
          parentName: formattedName,
          fields,
          forceNullable: forceNullableObjectType,
        }),
        mutationInputType: new GraphQLNonNull(buildMutationInputType(
          payload,
          formattedName,
          fields,
          formattedName,
        )),
      };

      payload.Query.fields[formattedName] = {
        type: payload.globals.graphQL[slug].type,
        args: {
          draft: { type: GraphQLBoolean },
          ...(payload.config.localization ? {
            locale: { type: payload.types.localeInputType },
            fallbackLocale: { type: payload.types.fallbackLocaleInputType },
          } : {}),
        },
        resolve: findOneResolver(global),
      };

      payload.Mutation.fields[`update${formattedName}`] = {
        type: payload.globals.graphQL[slug].type,
        args: {
          data: { type: payload.globals.graphQL[slug].mutationInputType },
          draft: { type: GraphQLBoolean },
          ...(payload.config.localization ? {
            locale: { type: payload.types.localeInputType },
          } : {}),
        },
        resolve: updateResolver(global),
      };

      payload.Query.fields[`docAccess${formattedName}`] = {
        type: buildPolicyType({
          typeSuffix: 'DocAccess',
          entity: global,
          type: 'global',
          scope: 'docAccess',
        }),
        resolve: docAccessResolver(global),
      };

      if (global.versions) {
        const versionGlobalFields: Field[] = [
          ...buildVersionGlobalFields(global),
          {
            name: 'id',
            type: 'text',
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
        ];

        payload.globals.graphQL[slug].versionType = buildObjectType({
          payload,
          name: `${formattedName}Version`,
          parentName: `${formattedName}Version`,
          fields: versionGlobalFields,
          forceNullable: forceNullableObjectType,
        });

        payload.Query.fields[`version${formatName(formattedName)}`] = {
          type: payload.globals.graphQL[slug].versionType,
          args: {
            id: { type: GraphQLString },
            ...(payload.config.localization ? {
              locale: { type: payload.types.localeInputType },
              fallbackLocale: { type: payload.types.fallbackLocaleInputType },
            } : {}),
          },
          resolve: findVersionByIDResolver(global),
        };
        payload.Query.fields[`versions${formattedName}`] = {
          type: buildPaginatedListType(`versions${formatName(formattedName)}`, payload.globals.graphQL[slug].versionType),
          args: {
            where: {
              type: buildWhereInputType(
                `versions${formattedName}`,
                versionGlobalFields,
                `versions${formattedName}`,
              ),
            },
            ...(payload.config.localization ? {
              locale: { type: payload.types.localeInputType },
              fallbackLocale: { type: payload.types.fallbackLocaleInputType },
            } : {}),
            page: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            sort: { type: GraphQLString },
          },
          resolve: findVersionsResolver(global),
        };
        payload.Mutation.fields[`restoreVersion${formatName(formattedName)}`] = {
          type: payload.globals.graphQL[slug].type,
          args: {
            id: { type: GraphQLString },
          },
          resolve: restoreVersionResolver(global),
        };
      }
    });
  }
}

export default initGlobalsGraphQL;
