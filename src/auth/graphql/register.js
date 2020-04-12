const {
  GraphQLString,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');
const {
  getFind, getFindByID, getDelete, getUpdate,
} = require('../../collections/graphql/resolvers');

const buildPaginatedListType = require('../../graphql/schema/buildPaginatedListType');

function registerUser() {
  const {
    config: {
      labels: {
        singular,
        plural,
      },
      fields,
    },
  } = this.User;

  const singularLabel = formatName(singular);
  const pluralLabel = formatName(plural);

  this.User.graphQL = {};

  this.User.graphQL.type = this.buildObjectType(
    singularLabel,
    fields,
    singularLabel,
    {
      id: { type: GraphQLString },
    },
  );

  this.User.graphQL.whereInputType = this.buildWhereInputType(
    singularLabel,
    fields,
    singularLabel,
  );

  this.User.graphQL.mutationInputType = this.buildMutationInputType(
    singularLabel,
    fields,
    singularLabel,
  );

  this.Query.fields[singularLabel] = {
    type: this.User.graphQL.type,
    args: {
      id: { type: GraphQLString },
      locale: { type: this.types.localeInputType },
      fallbackLocale: { type: this.types.fallbackLocaleInputType },
    },
    resolve: getFindByID(this.config, this.User),
  };

  this.Query.fields[pluralLabel] = {
    type: buildPaginatedListType(pluralLabel, this.User.graphQL.type),
    args: {
      where: { type: this.User.graphQL.whereInputType },
      locale: { type: this.types.localeInputType },
      fallbackLocale: { type: this.types.fallbackLocaleInputType },
      page: { type: GraphQLInt },
      limit: { type: GraphQLInt },
      sort: { type: GraphQLString },
    },
    resolve: getFind(this.config, this.User),
  };

  this.Mutation.fields[`update${singularLabel}`] = {
    type: this.User.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      data: { type: this.User.graphQL.mutationInputType },
    },
    resolve: getUpdate(this.config, this.User),
  };

  this.Mutation.fields[`delete${singularLabel}`] = {
    type: this.User.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: getDelete(this.User),
  };
}

module.exports = registerUser;
