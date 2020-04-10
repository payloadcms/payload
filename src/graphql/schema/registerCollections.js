const {
  GraphQLString,
  GraphQLInt,
} = require('graphql');

const formatName = require('../utilities/formatName');
const { getFind, getFindByID } = require('../../collections/graphql/resolvers');
const buildPaginatedListType = require('../schema/buildPaginatedListType');

function registerCollections() {
  Object.keys(this.collections).forEach((slug) => {
    const {
      config: {
        labels: {
          singular,
        },
        fields,
      },
    } = this.collections[slug];

    const singularLabel = formatName(singular);

    this.collections[slug].graphQLType = this.buildObjectType(
      singularLabel,
      fields,
      singularLabel,
      getFindByID(this.config, this.collections[slug]),
    );
  });

  Object.keys(this.collections).forEach((collectionSlug) => {
    const collection = this.collections[collectionSlug];

    const {
      config: {
        slug,
        fields,
        labels: {
          singular,
          plural,
        },
      },
    } = collection;

    const singularLabel = formatName(singular);
    const pluralLabel = formatName(plural);

    collection.graphQLWhereInputType = this.buildWhereInputType({
      name: singularLabel,
      fields,
      parent: singularLabel,
    });

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
