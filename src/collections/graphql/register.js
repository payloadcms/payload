const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');
const {
  create, find, findByID, deleteResolver, update,
} = require('./resolvers');
const buildPaginatedListType = require('../../graphql/schema/buildPaginatedListType');

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
      {
        id: { type: GraphQLString },
      },
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

    collection.graphQL.updateMutationInputType = this.buildMutationInputType(
      `${singularLabel}Update`,
      fields.map((field) => {
        return {
          ...field,
          required: false,
        };
      }),
      `${singularLabel}Update`,
    );

    this.Query.fields[singularLabel] = {
      type: collection.graphQL.type,
      args: {
        id: { type: GraphQLString },
        locale: { type: this.types.localeInputType },
        fallbackLocale: { type: this.types.fallbackLocaleInputType },
      },
      resolve: findByID(collection),
    };

    this.Query.fields[pluralLabel] = {
      type: buildPaginatedListType(pluralLabel, collection.graphQL.type),
      args: {
        where: { type: collection.graphQL.whereInputType },
        locale: { type: this.types.localeInputType },
        fallbackLocale: { type: this.types.fallbackLocaleInputType },
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
      resolve: find(collection),
    };

    this.Mutation.fields[`create${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        data: { type: collection.graphQL.mutationInputType },
      },
      resolve: create(collection),
    };

    this.Mutation.fields[`update${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        data: { type: collection.graphQL.updateMutationInputType },
      },
      resolve: update(collection),
    };

    this.Mutation.fields[`delete${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: deleteResolver(collection),
    };
  });
}

module.exports = registerCollections;
