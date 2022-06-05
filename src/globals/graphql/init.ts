import { GraphQLNonNull, GraphQLBoolean, GraphQLInt, GraphQLString } from 'graphql';
import formatName from '../../graphql/utilities/formatName';
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';
import findOneResolver from './resolvers/findOne';
import updateResolver from './resolvers/update';
import findVersionByIDResolver from './resolvers/findVersionByID';
import findVersionsResolver from './resolvers/findVersions';
import restoreVersionResolver from './resolvers/restoreVersion';

function registerGlobals() {
  if (this.config.globals) {
    Object.keys(this.globals.config).forEach((slug) => {
      const global = this.globals.config[slug];
      const {
        label,
        fields,
      } = global;

      const formattedLabel = formatName(label);

      global.graphQL = {};

      global.graphQL.type = this.buildObjectType(
        formattedLabel,
        fields,
        formattedLabel,
      );

      global.graphQL.mutationInputType = new GraphQLNonNull(this.buildMutationInputType(
        formattedLabel,
        fields,
        formattedLabel,
      ));

      this.Query.fields[formattedLabel] = {
        type: global.graphQL.type,
        args: {
          draft: { type: GraphQLBoolean },
          ...(this.config.localization ? {
            locale: { type: this.types.localeInputType },
            fallbackLocale: { type: this.types.fallbackLocaleInputType },
          } : {}),
        },
        resolve: findOneResolver(global),
      };

      this.Mutation.fields[`update${formattedLabel}`] = {
        type: global.graphQL.type,
        args: {
          data: { type: global.graphQL.mutationInputType },
          draft: { type: GraphQLBoolean },
        },
        resolve: updateResolver(global),
      };

      if (global.versions) {
        const versionGlobalFields = [
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
        global.graphQL.versionType = this.buildObjectType(
          `${formattedLabel}Version`,
          versionGlobalFields,
          `${formattedLabel}Version`,
          {},
        );
        this.Query.fields[`version${formatName(formattedLabel)}`] = {
          type: global.graphQL.versionType,
          args: {
            id: { type: GraphQLString },
            ...(this.config.localization ? {
              locale: { type: this.types.localeInputType },
              fallbackLocale: { type: this.types.fallbackLocaleInputType },
            } : {}),
          },
          resolve: findVersionByIDResolver(global),
        };
        this.Query.fields[`versions${formattedLabel}`] = {
          type: buildPaginatedListType(`versions${formatName(formattedLabel)}`, global.graphQL.versionType),
          args: {
            where: {
              type: this.buildWhereInputType(
                `versions${formattedLabel}`,
                versionGlobalFields,
                `versions${formattedLabel}`,
              ),
            },
            ...(this.config.localization ? {
              locale: { type: this.types.localeInputType },
              fallbackLocale: { type: this.types.fallbackLocaleInputType },
            } : {}),
            page: { type: GraphQLInt },
            limit: { type: GraphQLInt },
            sort: { type: GraphQLString },
          },
          resolve: findVersionsResolver(global),
        };
        this.Mutation.fields[`restoreVersion${formatName(formattedLabel)}`] = {
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

export default registerGlobals;
