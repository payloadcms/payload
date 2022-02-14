import { GraphQLNonNull, GraphQLBoolean, GraphQLInt, GraphQLString } from 'graphql';
import formatName from '../../graphql/utilities/formatName';
import { buildVersionGlobalFields } from '../../versions/buildGlobalFields';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';

function registerGlobals() {
  if (this.config.globals) {
    const {
      findOne, update, findVersionByID, findVersions, restoreVersion,
    } = this.graphQL.resolvers.globals;

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
        resolve: findOne(global),
      };

      this.Mutation.fields[`update${formattedLabel}`] = {
        type: global.graphQL.type,
        args: {
          data: { type: global.graphQL.mutationInputType },
          draft: { type: GraphQLBoolean },
        },
        resolve: update(global),
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
          resolve: findVersionByID(global),
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
          resolve: findVersions(global),
        };
        this.Mutation.fields[`restoreVersion${formatName(formattedLabel)}`] = {
          type: global.graphQL.type,
          args: {
            id: { type: GraphQLString },
          },
          resolve: restoreVersion(global),
        };
      }
    });
  }
}

export default registerGlobals;
