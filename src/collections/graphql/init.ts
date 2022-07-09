/* eslint-disable no-param-reassign */
import { DateTimeResolver } from 'graphql-scalars';
import {
  GraphQLString,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLInt,
} from 'graphql';

import formatName from '../../graphql/utilities/formatName';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';
import { BaseFields } from './types';
import buildMutationInputType, { getCollectionIDType } from '../../graphql/schema/buildMutationInputType';
import { buildVersionCollectionFields } from '../../versions/buildCollectionFields';
import createResolver from './resolvers/create';
import updateResolver from './resolvers/update';
import findResolver from './resolvers/find';
import findByIDResolver from './resolvers/findByID';
import findVersionByIDResolver from './resolvers/findVersionByID';
import findVersionsResolver from './resolvers/findVersions';
import restoreVersionResolver from './resolvers/restoreVersion';
import me from '../../auth/graphql/resolvers/me';
import init from '../../auth/graphql/resolvers/init';
import login from '../../auth/graphql/resolvers/login';
import logout from '../../auth/graphql/resolvers/logout';
import forgotPassword from '../../auth/graphql/resolvers/forgotPassword';
import resetPassword from '../../auth/graphql/resolvers/resetPassword';
import verifyEmail from '../../auth/graphql/resolvers/verifyEmail';
import unlock from '../../auth/graphql/resolvers/unlock';
import refresh from '../../auth/graphql/resolvers/refresh';
import { Payload } from '../..';
import { Field, fieldAffectsData } from '../../fields/config/types';
import buildObjectType from '../../graphql/schema/buildObjectType';
import buildWhereInputType from '../../graphql/schema/buildWhereInputType';
import getDeleteResolver from './resolvers/delete';

function initCollectionsGraphQL(payload: Payload): void {
  Object.keys(payload.collections).forEach((slug) => {
    const collection = payload.collections[slug];
    const {
      config: {
        labels: {
          singular,
          plural,
        },
        fields,
        timestamps,
      },
    } = collection;

    const singularLabel = formatName(singular);
    let pluralLabel = formatName(plural);

    // For collections named 'Media' or similar,
    // there is a possibility that the singular name
    // will equal the plural name. Append `all` to the beginning
    // of potential conflicts

    if (singularLabel === pluralLabel) {
      pluralLabel = `all${singularLabel}`;
    }

    collection.graphQL = {} as any;

    const idField = fields.find((field) => fieldAffectsData(field) && field.name === 'id');
    const idType = getCollectionIDType(collection.config);

    const baseFields: BaseFields = {};

    const whereInputFields = [
      ...fields,
    ];

    if (!idField) {
      baseFields.id = { type: idType };
      whereInputFields.push({
        name: 'id',
        type: 'text',
      });
    }

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
        label: 'Updated At',
        type: 'date',
      });
    }

    collection.graphQL.type = buildObjectType(
      payload,
      singularLabel,
      fields,
      singularLabel,
      baseFields,
    );

    collection.graphQL.whereInputType = buildWhereInputType(
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

    collection.graphQL.mutationInputType = new GraphQLNonNull(buildMutationInputType(
      payload,
      singularLabel,
      fields,
      singularLabel,
    ));

    collection.graphQL.updateMutationInputType = new GraphQLNonNull(buildMutationInputType(
      payload,
      `${singularLabel}Update`,
      fields.filter((field) => fieldAffectsData(field) && field.name !== 'id'),
      `${singularLabel}Update`,
      true,
    ));

    payload.Query.fields[singularLabel] = {
      type: collection.graphQL.type,
      args: {
        id: { type: idType },
        draft: { type: GraphQLBoolean },
        ...(payload.config.localization ? {
          locale: { type: payload.types.localeInputType },
          fallbackLocale: { type: payload.types.fallbackLocaleInputType },
        } : {}),
      },
      resolve: findByIDResolver(collection),
    };

    payload.Query.fields[pluralLabel] = {
      type: buildPaginatedListType(pluralLabel, collection.graphQL.type),
      args: {
        where: { type: collection.graphQL.whereInputType },
        draft: { type: GraphQLBoolean },
        ...(payload.config.localization ? {
          locale: { type: payload.types.localeInputType },
          fallbackLocale: { type: payload.types.fallbackLocaleInputType },
        } : {}),
        page: { type: GraphQLInt },
        limit: { type: GraphQLInt },
        sort: { type: GraphQLString },
      },
      resolve: findResolver(collection),
    };

    payload.Mutation.fields[`create${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        data: { type: collection.graphQL.mutationInputType },
        draft: { type: GraphQLBoolean },
      },
      resolve: createResolver(collection),
    };

    payload.Mutation.fields[`update${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
        data: { type: collection.graphQL.updateMutationInputType },
        draft: { type: GraphQLBoolean },
        autosave: { type: GraphQLBoolean },
      },
      resolve: updateResolver(collection),
    };

    payload.Mutation.fields[`delete${singularLabel}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: getDeleteResolver(collection),
    };

    if (collection.config.versions) {
      const versionCollectionFields: Field[] = [
        ...buildVersionCollectionFields(collection.config),
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'createdAt',
          label: 'Created At',
          type: 'date',
        },
        {
          name: 'updatedAt',
          label: 'Updated At',
          type: 'date',
        },
      ];
      collection.graphQL.versionType = buildObjectType(
        payload,
        `${singularLabel}Version`,
        versionCollectionFields,
        `${singularLabel}Version`,
        {},
      );
      payload.Query.fields[`version${formatName(singularLabel)}`] = {
        type: collection.graphQL.versionType,
        args: {
          id: { type: GraphQLString },
          ...(payload.config.localization ? {
            locale: { type: payload.types.localeInputType },
            fallbackLocale: { type: payload.types.fallbackLocaleInputType },
          } : {}),
        },
        resolve: findVersionByIDResolver(collection),
      };
      payload.Query.fields[`versions${pluralLabel}`] = {
        type: buildPaginatedListType(`versions${formatName(pluralLabel)}`, collection.graphQL.versionType),
        args: {
          where: {
            type: buildWhereInputType(
              `versions${singularLabel}`,
              versionCollectionFields,
              `versions${singularLabel}`,
            ),
          },
          ...(payload.config.localization ? {
            locale: { type: payload.types.localeInputType },
            fallbackLocale: { type: payload.types.fallbackLocaleInputType },
          } : {}),
          page: { type: GraphQLInt },
          limit: { type: GraphQLInt },
          sort: { type: GraphQLString },
        },
        resolve: findVersionsResolver(collection),
      };
      payload.Mutation.fields[`restoreVersion${formatName(singularLabel)}`] = {
        type: collection.graphQL.type,
        args: {
          id: { type: GraphQLString },
        },
        resolve: restoreVersionResolver(collection),
      };
    }

    if (collection.config.auth) {
      collection.graphQL.JWT = buildObjectType(
        payload,
        formatName(`${slug}JWT`),
        collection.config.fields.filter((field) => fieldAffectsData(field) && field.saveToJWT).concat([
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

      payload.Query.fields[`me${singularLabel}`] = {
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
        resolve: me(collection),
      };

      payload.Query.fields[`initialized${singularLabel}`] = {
        type: GraphQLBoolean,
        resolve: init(collection),
      };

      payload.Mutation.fields[`refreshToken${singularLabel}`] = {
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

      payload.Mutation.fields[`logout${singularLabel}`] = {
        type: GraphQLString,
        resolve: logout(collection),
      };

      if (!collection.config.auth.disableLocalStrategy) {
        if (collection.config.auth.maxLoginAttempts > 0) {
          payload.Mutation.fields[`unlock${singularLabel}`] = {
            type: new GraphQLNonNull(GraphQLBoolean),
            args: {
              email: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: unlock(collection),
          };
        }

        payload.Mutation.fields[`login${singularLabel}`] = {
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

        payload.Mutation.fields[`forgotPassword${singularLabel}`] = {
          type: new GraphQLNonNull(GraphQLBoolean),
          args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
            disableEmail: { type: GraphQLBoolean },
            expiration: { type: GraphQLInt },
          },
          resolve: forgotPassword(collection),
        };

        payload.Mutation.fields[`resetPassword${singularLabel}`] = {
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

        payload.Mutation.fields[`verifyEmail${singularLabel}`] = {
          type: GraphQLBoolean,
          args: {
            token: { type: GraphQLString },
          },
          resolve: verifyEmail(collection),
        };
      }
    }
  });
}

export default initCollectionsGraphQL;
