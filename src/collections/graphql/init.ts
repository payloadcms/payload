import { DateTimeResolver } from 'graphql-scalars';
import { GraphQLString, GraphQLObjectType, GraphQLBoolean, GraphQLNonNull, GraphQLInt } from 'graphql';

import formatName from '../../graphql/utilities/formatName';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';
import { BaseFields } from './types';

function registerCollections(): void {
  const {
    create, find, findByID, deleteResolver, update,
  } = this.graphQL.resolvers.collections;

  const {
    login, logout, me, init, refresh, forgotPassword, resetPassword, verifyEmail, unlock,
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

    const baseFields: BaseFields = {
      id: {
        type: new GraphQLNonNull(GraphQLString),
      },
    };

    const whereInputFields = [
      ...fields,
    ];

    if (timestamps) {
      baseFields.createdAt = {
        type: new GraphQLNonNull(DateTimeResolver),
      };

      baseFields.updatedAt = {
        type: new GraphQLNonNull(DateTimeResolver),
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

    const mutationInputFields = collection.config.id
      ? [{
        name: 'id',
        type: 'text',
        required: true,
      }, ...fields]
      : fields;

    collection.graphQL.mutationInputType = new GraphQLNonNull(this.buildMutationInputType(
      singularLabel,
      mutationInputFields,
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
              type: collection.graphQL.type,
            },
            exp: {
              type: GraphQLInt,
            },
            collection: {
              type: GraphQLString,
            },
          },
        }),
        resolve: me(slug),
      };

      if (collection.config.auth.maxLoginAttempts > 0) {
        this.Mutation.fields[`unlock${singularLabel}`] = {
          type: new GraphQLNonNull(GraphQLBoolean),
          args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
          },
          resolve: unlock(collection),
        };
      }

      this.Query.fields[`initialized${singularLabel}`] = {
        type: GraphQLBoolean,
        resolve: init(collection),
      };

      this.Mutation.fields[`login${singularLabel}`] = {
        type: new GraphQLObjectType({
          name: formatName(`${slug}LoginResult`),
          fields: {
            token: {
              type: GraphQLString,
            },
            user: {
              type: collection.graphQL.type,
            },
            exp: {
              type: GraphQLInt,
            },
          },
        }),
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
        type: new GraphQLObjectType({
          name: formatName(`${slug}ResetPassword`),
          fields: {
            token: { type: GraphQLString },
            user: { type: collection.graphQL.type },
          },
        }),
        args: {
          token: { type: GraphQLString },
          password: { type: GraphQLString },
        },
        resolve: resetPassword(collection),
      };

      this.Mutation.fields[`verifyEmail${singularLabel}`] = {
        type: GraphQLBoolean,
        args: {
          token: { type: GraphQLString },
        },
        resolve: verifyEmail(collection),
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
            exp: {
              type: GraphQLInt,
            },
          },
        }),
        args: {
          token: { type: GraphQLString },
        },
        resolve: refresh(collection),
      };
    }
  });
}

export default registerCollections;
