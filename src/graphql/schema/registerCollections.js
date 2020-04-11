const {
  GraphQLString,
  GraphQLInt,
} = require('graphql');

const formatName = require('../utilities/formatName');
const { getCreate, getFind, getFindByID } = require('../../collections/graphql/resolvers');
const buildPaginatedListType = require('../schema/buildPaginatedListType');

function registerCollections() {
  Object.keys(this.collections).forEach((slug) => {
    const collection = this.collections[slug];
    const {
      config: {
        labels: {
          singular,
          plural,
        },
        fields,
      },
    } = collection;

    const singularLabel = formatName(singular);
    const pluralLabel = formatName(plural);

    collection.graphQL = {};

    collection.graphQL.type = this.buildObjectType(
      singularLabel,
      fields,
      singularLabel,
      getFindByID(this.config, collection),
    );

    collection.graphQL.whereInputType = this.buildWhereInputType(
      singularLabel,
      fields,
      singularLabel,
    );

    collection.graphQL.mutationInputType = this.buildMutationInputType(
      singularLabel,
      fields,
      singularLabel,
    );

    this.Query.fields[singularLabel] = {
      type: collection.graphQL.type,
      args: {
        id: { type: GraphQLString },
        locale: { type: this.types.localeInputType },
        fallbackLocale: { type: this.types.fallbackLocaleInputType },
      },
      resolve: getFindByID(this.config, collection),
    };

    this.Query.fields[pluralLabel] = {
      type: buildPaginatedListType(pluralLabel, collection.graphQL.type),
      args: {
        where: { type: collection.graphQL.whereInputType },
        locale: { type: this.types.localeInputType },
        fallbackLocale: { type: this.types.fallbackLocaleInputType },
        page: { type: GraphQLInt },
        offset: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
      resolve: getFind(this.config, collection),
    };

    this.Mutation.fields[`create${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        data: { type: collection.graphQL.mutationInputType },
      },
      resolve: getCreate(this.config, collection),
    };
  });
}

module.exports = registerCollections;
