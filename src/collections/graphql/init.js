const {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLInt,
} = require('graphql');

const formatName = require('../../graphql/utilities/formatName');

const buildPaginatedListType = require('../../graphql/schema/buildPaginatedListType');

function registerCollections() {
  const {
    create, find, findByID, deleteResolver, update,
  } = this.graphQL.resolvers.collections;

  const {
    login, logout, me, init, refresh, forgotPassword, resetPassword,
  } = this.graphQL.resolvers.collections.auth;

  Object.keys(this.collections).forEach((slug) => {
    const collection = this.collections[slug];
    const {
      config: {
        labels: {
          singular,
          plural,
        },
        fields: initialFields,
        timestamps,
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

    const baseFields = {
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    };

    const whereInputFields = [
      ...fields,
    ];

    if (timestamps) {
      baseFields.createdAt = {
        type: new GraphQLNonNull(GraphQLString),
      };

      baseFields.updatedAt = {
        type: new GraphQLNonNull(GraphQLString),
      };

      whereInputFields.push({
        name: 'createdAt',
        label: 'Created At',
        type: 'date',
      });

      whereInputFields.push({
        name: 'updatedAt',
        label: 'Upated At',
        type: 'date',
      });
    }

    collection.graphQL.type = this.buildObjectType(
      singularLabel,
      fields,
      singularLabel,
      baseFields,
    );

    collection.graphQL.whereInputType = this.buildWhereInputType(
      singularLabel,
      whereInputFields,
      singularLabel,
    );

    if (collection.config.auth) {
      fields.push({
        name: 'password',
        label: 'Password',
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
      fields,
      `${singularLabel}Update`,
      true,
    ));

    this.Query.fields[singularLabel] = {
      type: collection.graphQL.type,
      args: {
        id: { type: GraphQLString },
        ...(this.config.localization ? {
          locale: { type: this.types.localeInputType },
          fallbackLocale: { type: this.types.fallbackLocaleInputType },
        } : {}),
      },
      resolve: findByID(collection),
    };

    this.Query.fields[pluralLabel] = {
      type: buildPaginatedListType(pluralLabel, collection.graphQL.type),
      args: {
        where: { type: collection.graphQL.whereInputType },
        ...(this.config.localization ? {
          locale: { type: this.types.localeInputType },
          fallbackLocale: { type: this.types.fallbackLocaleInputType },
        } : {}),
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

    if (collection.config.auth) {
      collection.graphQL.JWT = this.buildObjectType(
        formatName(`${slug}JWT`),
        collection.config.fields.filter((field) => field.saveToJWT).concat([
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
        formatName(`${slug}JWT`),
      );

      this.Query.fields[`me${singularLabel}`] = {
        type: new GraphQLObjectType({
          name: formatName(`${slug}Me`),
          fields: {
            token: {
              type: GraphQLString,
            },
            user: {
              type: this.buildObjectType(
                formatName(`${slug}Me${singularLabel}`),
                collection.config.fields.concat([
                  {
                    name: 'id',
                    label: 'ID',
                    type: 'text',
                  },
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
                formatName(`${slug}MeUser`),
              ),
            },
          },
        }),
        resolve: me,
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
        resolve: login(collection),
      };

      this.Mutation.fields[`logout${singularLabel}`] = {
        type: GraphQLString,
        resolve: logout(collection),
      };

      this.Mutation.fields[`forgotPassword${singularLabel}`] = {
        type: new GraphQLNonNull(GraphQLBoolean),
        args: {
          email: { type: new GraphQLNonNull(GraphQLString) },
          disableEmail: { type: GraphQLBoolean },
          expiration: { type: GraphQLInt },
        },
        resolve: forgotPassword(collection),
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
        type: new GraphQLObjectType({
          name: formatName(`${slug}Refreshed${singularLabel}`),
          fields: {
            user: {
              type: collection.graphQL.JWT,
            },
            refreshedToken: {
              type: GraphQLString,
            },
          },
        }),
        resolve: refresh(collection),
      };
    }
  });
}

module.exports = registerCollections;
