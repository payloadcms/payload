const {
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');
const buildPaginatedListType = require('../../graphql/schema/buildPaginatedListType');

const {
  find, findByID, deleteResolver,
} = require('../../collections/graphql/resolvers');

const {
  login, me, init, refresh, register, update, forgotPassword, resetPassword,
} = require('./resolvers');

function registerUser() {
  const {
    config: {
      labels: {
        singular,
        plural,
      },
      fields,
      auth: {
        useAsUsername,
      },
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

  const mutationFields = [
    ...fields,
    {
      name: 'password',
      type: 'text',
      required: true,
    },
  ];

  this.User.graphQL.mutationInputType = this.buildMutationInputType(
    singularLabel,
    mutationFields,
    singularLabel,
  );

  this.User.graphQL.updateMutationInputType = this.buildMutationInputType(
    `${singularLabel}Update`,
    mutationFields.map((field) => {
      return {
        ...field,
        required: false,
      };
    }),
    `${singularLabel}Update`,
  );

  this.User.graphQL.jwt = this.buildObjectType(
    'JWT',
    this.User.config.fields.reduce((jwtFields, potentialField) => {
      if (potentialField.saveToJWT) {
        return [
          ...jwtFields,
          potentialField,
        ];
      }

      return jwtFields;
    }, [
      {
        name: this.User.config.auth.useAsUsername,
        type: 'text',
        required: true,
      },
    ]),
  );

  this.Query.fields[singularLabel] = {
    type: this.User.graphQL.type,
    args: {
      id: { type: GraphQLString },
      locale: { type: this.types.localeInputType },
      fallbackLocale: { type: this.types.fallbackLocaleInputType },
    },
    resolve: findByID(this.User),
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
    resolve: find(this.User),
  };

  this.Query.fields.Me = {
    type: this.User.graphQL.jwt,
    resolve: me,
  };

  this.Query.fields.Initialized = {
    type: GraphQLBoolean,
    resolve: init(this.User),
  };

  this.Mutation.fields[`update${singularLabel}`] = {
    type: this.User.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
      data: { type: this.User.graphQL.updateMutationInputType },
    },
    resolve: update(this.User),
  };

  this.Mutation.fields[`delete${singularLabel}`] = {
    type: this.User.graphQL.type,
    args: {
      id: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: deleteResolver(this.User),
  };

  this.Mutation.fields.login = {
    type: GraphQLString,
    args: {
      [useAsUsername]: { type: GraphQLString },
      password: { type: GraphQLString },
    },
    resolve: login(this.User),
  };

  this.Mutation.fields.register = {
    type: this.User.graphQL.type,
    args: {
      data: { type: this.User.graphQL.mutationInputType },
    },
    resolve: register(this.User),
  };

  this.Mutation.fields.resetPassword = {
    type: this.User.graphQL.type,
    args: {
      token: { type: GraphQLString },
      password: { type: GraphQLString },
    },
    resolve: resetPassword(this.User),
  };

  this.Mutation.fields.forgotPassword = {
    type: new GraphQLNonNull(GraphQLBoolean),
    args: {
      [useAsUsername]: { type: GraphQLString },
    },
    resolve: forgotPassword(this.User, this.email),
  };

  this.Mutation.fields.refreshToken = {
    type: GraphQLString,
    resolve: refresh(this.User),
  };
}

module.exports = registerUser;
