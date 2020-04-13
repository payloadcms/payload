const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');
const {
  getCreate, getFind, getFindByID, getDelete, getUpdate,
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

  this.Upload.graphQL.mutationInputType = this.buildMutationInputType(
    singularLabel,
    fields,
    singularLabel,
  );

  this.Query.fields[singularLabel] = {
    type: this.Upload.graphQL.type,
    args: {
      id: { type: GraphQLString },
      locale: { type: this.types.localeInputType },
      fallbackLocale: { type: this.types.fallbackLocaleInputType },
    },
    resolve: getFindByID(this.config, this.Upload),
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
    resolve: getFind(this.config, this.Upload),
  };

  this.Mutation.fields[`update${singularLabel}`] = {
    type: this.Upload.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      data: { type: this.Upload.graphQL.mutationInputType },
    },
    resolve: getUpdate(this.config, this.Upload),
  };

  this.Mutation.fields[`delete${singularLabel}`] = {
    type: this.Upload.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: getDelete(this.Upload),
  };
}

module.exports = registerUpload;
