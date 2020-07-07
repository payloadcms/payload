const {
  GraphQLString,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');

const {
  create, find, findByID, deleteResolver, update,
} = require('./resolvers');

const {
  login, me, init, refresh, register, forgotPassword, resetPassword,
} = require('../../auth/graphql/resolvers');

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
        fields: initialFields,
      },
    } = collection;

    const fields = [...initialFields];

    const singularLabel = formatName(singular);
    let pluralLabel = formatName(plural);


    // For collections named 'Media' or similar,
    // there is a possibility that the singular name
    // will equal the plural name. Append `all` to the beginning
    // of potential conflicts

    if (singularLabel === pluralLabel) {
      pluralLabel = `all${singularLabel}`;
    }

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

    if (collection.auth) {
      fields.push({
        name: 'password',
        type: 'text',
        required: true,
      });
    }

    collection.graphQL.mutationInputType = new GraphQLNonNull(this.buildMutationInputType(
      singularLabel,
      fields,
      singularLabel,
    ));

    collection.graphQL.updateMutationInputType = new GraphQLNonNull(this.buildMutationInputType(
      `${singularLabel}Update`,
      fields.map((field) => {
        return {
          ...field,
          required: false,
        };
      }),
      `${singularLabel}Update`,
    ));

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

    if (collection.config.auth) {
      collection.graphQL.jwt = this.buildObjectType(
        formatName(`${slug}JWT`),
        collection.config.fields.filter(field => field.saveToJWT).concat([
          {
            name: 'email',
            type: 'email',
            required: true,
          },
          {
            name: 'collection',
            type: 'text',
            required: true,
          },
          {
            name: 'exp',
            type: 'number',
          },
        ]),
      );

      this.Query.fields[`me${singularLabel}`] = {
        type: collection.graphQL.jwt,
        resolve: me(this.config),
      };

      this.Query.fields[`initialized${singularLabel}`] = {
        type: GraphQLBoolean,
        resolve: init(collection),
      };

      this.Mutation.fields[`login${singularLabel}`] = {
        type: GraphQLString,
        args: {
          email: { type: GraphQLString },
          password: { type: GraphQLString },
        },
        resolve: login(this.config, collection),
      };

      this.Mutation.fields[`register${singularLabel}`] = {
        type: collection.graphQL.type,
        args: {
          data: { type: collection.graphQL.mutationInputType },
        },
        resolve: register(this.config, collection),
      };

      this.Mutation.fields[`forgotPassword${singularLabel}`] = {
        type: new GraphQLNonNull(GraphQLBoolean),
        args: {
          email: { type: new GraphQLNonNull(GraphQLString) },
        },
        resolve: forgotPassword(this.config, collection.Model, this.sendEmail),
      };

      this.Mutation.fields[`resetPassword${singularLabel}`] = {
        type: GraphQLString,
        args: {
          token: { type: GraphQLString },
          password: { type: GraphQLString },
        },
        resolve: resetPassword(collection),
      };

      this.Mutation.fields[`refreshToken${singularLabel}`] = {
        type: GraphQLString,
        resolve: refresh(this.config, collection),
      };
    } else {
      this.Mutation.fields[`create${singularLabel}`] = {
        type: collection.graphQL.type,
        args: {
          data: { type: collection.graphQL.mutationInputType },
        },
        resolve: create(collection),
      };
    }
  });
}

module.exports = registerCollections;
