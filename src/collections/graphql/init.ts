/* eslint-disable no-param-reassign */
import { GraphQLBoolean, GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

import formatName from '../../graphql/utilities/formatName';
import buildPaginatedListType from '../../graphql/schema/buildPaginatedListType';
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
import { Payload } from '../../payload';
import { Field, fieldAffectsData } from '../../fields/config/types';
import buildObjectType, { ObjectTypeConfig } from '../../graphql/schema/buildObjectType';
import buildWhereInputType from '../../graphql/schema/buildWhereInputType';
import getDeleteResolver from './resolvers/delete';
import { formatNames, toWords } from '../../utilities/formatLabels';
import { Collection, SanitizedCollectionConfig } from '../config/types';
import { buildPolicyType } from '../../graphql/schema/buildPoliciesType';
import { docAccessResolver } from './resolvers/docAccess';

function initCollectionsGraphQL(payload: Payload): void {
  Object.keys(payload.collections).forEach((slug) => {
    const collection: Collection = payload.collections[slug];
    const {
      config,
      config: {
        graphQL = {} as SanitizedCollectionConfig['graphQL'],
        versions,
      },
    } = collection;
    const { fields } = config;

    let singularName;
    let pluralName;
    const fromSlug = formatNames(collection.config.slug);
    if (graphQL.singularName) {
      singularName = toWords(graphQL.singularName, true);
    } else {
      singularName = fromSlug.singular;
    }
    if (graphQL.pluralName) {
      pluralName = toWords(graphQL.pluralName, true);
    } else {
      pluralName = fromSlug.plural;
    }

    // For collections named 'Media' or similar,
    // there is a possibility that the singular name
    // will equal the plural name. Append `all` to the beginning
    // of potential conflicts
    if (singularName === pluralName) {
      pluralName = `all${singularName}`;
    }

    collection.graphQL = {} as Collection['graphQL'];

    const idField = fields.find((field) => fieldAffectsData(field) && field.name === 'id');
    const idType = getCollectionIDType(config);

    const baseFields: ObjectTypeConfig = {};

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

    const forceNullableObjectType = Boolean(versions?.drafts);

    collection.graphQL.type = buildObjectType({
      payload,
      name: singularName,
      parentName: singularName,
      fields,
      baseFields,
      forceNullable: forceNullableObjectType,
    });

    collection.graphQL.paginatedType = buildPaginatedListType(
      pluralName,
      collection.graphQL.type
    );

    collection.graphQL.whereInputType = buildWhereInputType(
      singularName,
      whereInputFields,
      singularName,
    );

    if (config.auth && !config.auth.disableLocalStrategy) {
      fields.push({
        name: 'password',
        label: 'Password',
        type: 'text',
        required: true,
      });
    }

    collection.graphQL.mutationInputType = new GraphQLNonNull(buildMutationInputType(
      payload,
      singularName,
      fields,
      singularName,
    ));

    collection.graphQL.updateMutationInputType = new GraphQLNonNull(buildMutationInputType(
      payload,
      `${singularName}Update`,
      fields.filter((field) => !(fieldAffectsData(field) && field.name === 'id')),
      `${singularName}Update`,
      true,
    ));

    payload.Query.fields[singularName] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
        draft: { type: GraphQLBoolean },
        ...(payload.config.localization ? {
          locale: { type: payload.types.localeInputType },
          fallbackLocale: { type: payload.types.fallbackLocaleInputType },
        } : {}),
      },
      resolve: findByIDResolver(collection),
    };

    payload.Query.fields[pluralName] = {
      type: buildPaginatedListType(pluralName, collection.graphQL.type),
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

    payload.Query.fields[`docAccess${singularName}`] = {
      type: buildPolicyType({
        typeSuffix: 'DocAccess',
        entity: config,
        type: 'collection',
        scope: 'docAccess',
      }),
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: docAccessResolver(),
    };

    payload.Mutation.fields[`create${singularName}`] = {
      type: collection.graphQL.type,
      args: {
        data: { type: collection.graphQL.mutationInputType },
        draft: { type: GraphQLBoolean },
        ...(payload.config.localization ? {
          locale: { type: payload.types.localeInputType },
        } : {}),
      },
      resolve: createResolver(collection),
    };

    payload.Mutation.fields[`update${singularName}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
        data: { type: collection.graphQL.updateMutationInputType },
        draft: { type: GraphQLBoolean },
        autosave: { type: GraphQLBoolean },
        ...(payload.config.localization ? {
          locale: { type: payload.types.localeInputType },
        } : {}),
      },
      resolve: updateResolver(collection),
    };

    payload.Mutation.fields[`delete${singularName}`] = {
      type: collection.graphQL.type,
      args: {
        id: { type: new GraphQLNonNull(idType) },
      },
      resolve: getDeleteResolver(collection),
    };

    if (config.versions) {
      const versionCollectionFields: Field[] = [
        ...buildVersionCollectionFields(config),
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

      collection.graphQL.versionType = buildObjectType({
        payload,
        name: `${singularName}Version`,
        fields: versionCollectionFields,
        parentName: `${singularName}Version`,
        forceNullable: forceNullableObjectType,
      });

      payload.Query.fields[`version${formatName(singularName)}`] = {
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
      payload.Query.fields[`versions${pluralName}`] = {
        type: buildPaginatedListType(`versions${formatName(pluralName)}`, collection.graphQL.versionType),
        args: {
          where: {
            type: buildWhereInputType(
              `versions${singularName}`,
              versionCollectionFields,
              `versions${singularName}`,
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
      payload.Mutation.fields[`restoreVersion${formatName(singularName)}`] = {
        type: collection.graphQL.type,
        args: {
          id: { type: GraphQLString },
        },
        resolve: restoreVersionResolver(collection),
      };
    }

    if (config.auth) {
      const authFields: Field[] = config.auth.disableLocalStrategy ? [] : [{
        name: 'email',
        type: 'email',
        required: true,
      }];
      collection.graphQL.JWT = buildObjectType({
        payload,
        name: formatName(`${slug}JWT`),
        fields: [
          ...config.fields.filter((field) => fieldAffectsData(field) && field.saveToJWT),
          ...authFields,
          {
            name: 'collection',
            type: 'text',
            required: true,
          },
        ],
        parentName: formatName(`${slug}JWT`),
      });

      payload.Query.fields[`me${singularName}`] = {
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

      payload.Query.fields[`initialized${singularName}`] = {
        type: GraphQLBoolean,
        resolve: init(collection),
      };

      payload.Mutation.fields[`refreshToken${singularName}`] = {
        type: new GraphQLObjectType({
          name: formatName(`${slug}Refreshed${singularName}`),
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

      payload.Mutation.fields[`logout${singularName}`] = {
        type: GraphQLString,
        resolve: logout(collection),
      };

      if (!config.auth.disableLocalStrategy) {
        if (config.auth.maxLoginAttempts > 0) {
          payload.Mutation.fields[`unlock${singularName}`] = {
            type: new GraphQLNonNull(GraphQLBoolean),
            args: {
              email: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve: unlock(collection),
          };
        }

        payload.Mutation.fields[`login${singularName}`] = {
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

        payload.Mutation.fields[`forgotPassword${singularName}`] = {
          type: new GraphQLNonNull(GraphQLBoolean),
          args: {
            email: { type: new GraphQLNonNull(GraphQLString) },
            disableEmail: { type: GraphQLBoolean },
            expiration: { type: GraphQLInt },
          },
          resolve: forgotPassword(collection),
        };

        payload.Mutation.fields[`resetPassword${singularName}`] = {
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

        payload.Mutation.fields[`verifyEmail${singularName}`] = {
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
