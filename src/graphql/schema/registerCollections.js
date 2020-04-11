const {
  GraphQLString,
  GraphQLInt,
} = require('graphql');

const formatName = require('../utilities/formatName');
const { getFind, getFindByID } = require('../../collections/graphql/resolvers');
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

    collection.graphQLType = this.buildObjectType(
      singularLabel,
      fields,
      singularLabel,
      getFindByID(this.config, collection),
    );

    collection.graphQLWhereInputType = this.buildWhereInputType(
      singularLabel,
      fields,
      singularLabel,
    );

    this.Query.fields[singularLabel] = {
      type: this.collections[slug].graphQLType,
      args: {
        id: { type: GraphQLString },
        locale: { type: this.types.localeInputType },
        fallbackLocale: { type: this.types.fallbackLocaleInputType },
      },
      resolve: getFindByID(this.config, collection),
    };

    this.Query.fields[pluralLabel] = {
      type: buildPaginatedListType(pluralLabel, collection.graphQLType),
      args: {
        where: { type: collection.graphQLWhereInputType },
        locale: { type: this.types.localeInputType },
        fallbackLocale: { type: this.types.fallbackLocaleInputType },
        page: { type: GraphQLInt },
        offset: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
      resolve: getFind(this.config, collection),
    };
  });
}

module.exports = registerCollections;
