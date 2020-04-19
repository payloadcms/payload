const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');
const {
  create, find, findByID, deleteResolver, update,
} = require('../../collections/graphql/resolvers');

const buildPaginatedListType = require('../../graphql/schema/buildPaginatedListType');

function registerUpload() {
  const {
    config: {
      labels: {
        singular,
        plural,
      },
      fields,
    },
  } = this.Upload;

  const singularLabel = formatName(singular);
  const pluralLabel = formatName(plural);

  this.Upload.graphQL = {};

  this.Upload.graphQL.type = this.buildObjectType(
    singularLabel,
    fields,
    singularLabel,
    {
      id: { type: GraphQLString },
    },
  );

  this.Upload.graphQL.whereInputType = this.buildWhereInputType(
    singularLabel,
    fields,
    singularLabel,
  );

  this.Upload.graphQL.mutationInputType = new GraphQLNonNull(this.buildMutationInputType(
    singularLabel,
    fields,
    singularLabel,
  ));

  this.Query.fields[singularLabel] = {
    type: this.Upload.graphQL.type,
    args: {
      id: { type: GraphQLString },
      locale: { type: this.types.localeInputType },
      fallbackLocale: { type: this.types.fallbackLocaleInputType },
    },
    resolve: findByID(this.Upload),
  };

  this.Query.fields[pluralLabel] = {
    type: buildPaginatedListType(pluralLabel, this.Upload.graphQL.type),
    args: {
      where: { type: this.Upload.graphQL.whereInputType },
      locale: { type: this.types.localeInputType },
      fallbackLocale: { type: this.types.fallbackLocaleInputType },
      page: { type: GraphQLInt },
      limit: { type: GraphQLInt },
      sort: { type: GraphQLString },
    },
    resolve: find(this.Upload),
  };

  this.Mutation.fields[`update${singularLabel}`] = {
    type: this.Upload.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      data: { type: this.Upload.graphQL.mutationInputType },
    },
    resolve: update(this.Upload),
  };

  this.Mutation.fields[`delete${singularLabel}`] = {
    type: this.Upload.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: deleteResolver(this.Upload),
  };
}

module.exports = registerUpload;
