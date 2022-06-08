/* eslint-disable no-param-reassign */
import { GraphQLNonNull, GraphQLBoolean, GraphQLInt, GraphQLString } from 'graphql';
import formatName from '../../graphql/utilities/formatName';
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';
import findOneResolver from './resolvers/findOne';
import updateResolver from './resolvers/update';
import findVersionByIDResolver from './resolvers/findVersionByID';
import findVersionsResolver from './resolvers/findVersions';
import restoreVersionResolver from './resolvers/restoreVersion';
import { Payload } from '../..';
import buildObjectType from '../../graphql/schema/buildObjectType';
import buildMutationInputType from '../../graphql/schema/buildMutationInputType';
import buildWhereInputType from '../../graphql/schema/buildWhereInputType';
import { Field } from '../../fields/config/types';

function initGlobalsGraphQL(payload: Payload): void {
  if (payload.config.globals) {
    Object.keys(payload.globals.config).forEach((slug) => {
      const global = payload.globals.config[slug];
      const {
        label,
        fields,
      } = global;

      const formattedLabel = formatName(label);

      global.graphQL = {};

      global.graphQL.type = buildObjectType(
        payload,
        formattedLabel,
        fields,
        formattedLabel,
      );

      global.graphQL.mutationInputType = new GraphQLNonNull(buildMutationInputType(
        payload,
        formattedLabel,
        fields,
        formattedLabel,
      ));

      payload.Query.fields[formattedLabel] = {
        type: global.graphQL.type,
        args: {
          draft: { type: GraphQLBoolean },
          ...(payload.config.localization ? {
            locale: { type: payload.types.localeInputType },
            fallbackLocale: { type: payload.types.fallbackLocaleInputType },
          } : {}),
        },
        resolve: findOneResolver(global),
      };

      payload.Mutation.fields[`update${formattedLabel}`] = {
        type: global.graphQL.type,
        args: {
          data: { type: global.graphQL.mutationInputType },
          draft: { type: GraphQLBoolean },
        },
        resolve: updateResolver(global),
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
        global.graphQL.versionType = buildObjectType(
          payload,
          `${formattedLabel}Version`,
          versionGlobalFields,
          `${formattedLabel}Version`,
          {},
        );
        payload.Query.fields[`version${formatName(formattedLabel)}`] = {
          type: global.graphQL.versionType,
          args: {
            id: { type: GraphQLString },
            ...(payload.config.localization ? {
              locale: { type: payload.types.localeInputType },
              fallbackLocale: { type: payload.types.fallbackLocaleInputType },
            } : {}),
          },
          resolve: findVersionByIDResolver(global),
        };
        payload.Query.fields[`versions${formattedLabel}`] = {
          type: buildPaginatedListType(`versions${formatName(formattedLabel)}`, global.graphQL.versionType),
          args: {
            where: {
              type: buildWhereInputType(
                `versions${formattedLabel}`,
                versionGlobalFields,
                `versions${formattedLabel}`,
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
        payload.Mutation.fields[`restoreVersion${formatName(formattedLabel)}`] = {
          type: global.graphQL.type,
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
