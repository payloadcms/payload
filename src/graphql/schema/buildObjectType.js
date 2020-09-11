/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
const {
  GraphQLString,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLEnumType,
} = require('graphql');
const { GraphQLJSON } = require('graphql-type-json');

const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');
const withNullableType = require('./withNullableType');

function buildObjectType(name, fields, parentName, baseFields = {}) {
  const recursiveBuildObjectType = buildObjectType.bind(this);

  const fieldToSchemaMap = {
    number: (field) => ({ type: withNullableType(field, GraphQLFloat) }),
    text: (field) => ({ type: withNullableType(field, GraphQLString) }),
    email: (field) => ({ type: withNullableType(field, GraphQLString) }),
    textarea: (field) => ({ type: withNullableType(field, GraphQLString) }),
    richText: (field) => ({ type: withNullableType(field, GraphQLJSON) }),
    code: (field) => ({ type: withNullableType(field, GraphQLString) }),
    date: (field) => ({ type: withNullableType(field, GraphQLString) }),
    upload: (field) => {
      const { relationTo, label } = field;
      const uploadName = combineParentName(parentName, label);

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      const type = this.collections[relationTo].graphQL.type || newlyCreatedBlockType;

      const uploadArgs = {};

      if (this.config.localization) {
        uploadArgs.locale = {
          type: this.types.localeInputType,
        };

        uploadArgs.fallbackLocale = {
          type: this.types.fallbackLocaleInputType,
        };
      }

      const relatedCollectionSlug = field.relationTo;
      const relatedCollection = this.collections[relatedCollectionSlug];

      const { find } = this.operations.collections;

      const upload = {
        args: uploadArgs,
        type,
        async resolve(parent, args, context) {
          const value = parent[field.name];
          const locale = args.locale || context.locale;
          const fallbackLocale = args.fallbackLocale || context.fallbackLocale;

          let id = value;

          if (id) {
            id = id.toString();

            const relatedDocumentQuery = {
              collection: relatedCollection,
              where: {
                ...(args.where || {}),
                _id: {
                  equals: id,
                },
              },
              req: {
                ...context,
                locale,
                fallbackLocale,
              },
            };

            const relatedDocument = await find(relatedDocumentQuery);

            if (relatedDocument.docs[0]) return relatedDocument.docs[0];

            return null;
          }

          return null;
        },
      };

      const whereFields = this.collections[relationTo].config.fields;

      upload.args.where = {
        type: this.buildWhereInputType(
          uploadName,
          whereFields,
          uploadName,
        ),
      };

      return upload;
    },
    radio: (field) => ({ type: withNullableType(field, GraphQLString) }),
    checkbox: (field) => ({ type: withNullableType(field, GraphQLBoolean) }),
    select: (field) => {
      const fullName = combineParentName(parentName, field.name);

      let type = new GraphQLEnumType({
        name: fullName,
        values: field.options.reduce((values, option) => {
          if (typeof option === 'object' && option.value) {
            return {
              ...values,
              [formatName(option.value)]: {
                value: option.value,
              },
            };
          }

          if (typeof option === 'string') {
            return {
              ...values,
              [formatName(option)]: {
                value: option,
              },
            };
          }

          return values;
        }, {}),
      });

      type = field.hasMany ? new GraphQLList(type) : type;
      type = withNullableType(field, type);

      return { type };
    },
    relationship: (field) => {
      const { relationTo, label } = field;
      const isRelatedToManyCollections = Array.isArray(relationTo);
      const hasManyValues = field.hasMany;
      const relationshipName = combineParentName(parentName, label);

      let type;
      let relationToType = null;

      if (isRelatedToManyCollections) {
        relationToType = new GraphQLEnumType({
          name: `${relationshipName}_RelationTo`,
          values: field.relationTo.reduce((relations, relation) => ({
            ...relations,
            [formatName(relation)]: {
              value: relation,
            },
          }), {}),
        });

        const types = relationTo.map((relation) => this.collections[relation].graphQL.type);

        let resolveType = function resolveType(data) {
          return this.collections[data.collection].graphQL.type;
        };

        resolveType = resolveType.bind(this);

        type = new GraphQLObjectType({
          name: `${relationshipName}_Relationship`,
          fields: {
            relationTo: {
              type: relationToType,
            },
            value: {
              type: new GraphQLUnionType({
                name: relationshipName,
                types,
                resolveType,
              }),
            },
          },
        });
      } else {
        ({ type } = this.collections[relationTo].graphQL);
      }

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      type = type || newlyCreatedBlockType;

      const relationshipArgs = {};

      if (this.config.localization) {
        relationshipArgs.locale = {
          type: this.types.localeInputType,
        };

        relationshipArgs.fallbackLocale = {
          type: this.types.fallbackLocaleInputType,
        };
      }

      const {
        collections,
        operations: {
          collections: {
            find,
          },
        },
      } = this;

      const relationship = {
        args: relationshipArgs,
        type: hasManyValues ? new GraphQLList(type) : type,
        async resolve(parent, args, context) {
          const value = parent[field.name];
          const locale = args.locale || context.locale;
          const fallbackLocale = args.fallbackLocale || context.fallbackLocale;
          let relatedCollectionSlug = field.relationTo;

          if (hasManyValues) {
            const results = [];
            const resultPromises = [];

            const createPopulationPromise = async (relatedDoc) => {
              let id = relatedDoc;

              if (isRelatedToManyCollections) {
                relatedCollectionSlug = relatedDoc.relationTo;
                id = relatedDoc.value;
              }

              const result = await find({
                collection: collections[relatedCollectionSlug],
                where: {
                  ...(args.where || {}),
                  _id: {
                    equals: id,
                  },
                },
                req: {
                  ...context,
                  locale,
                  fallbackLocale,
                },
              });

              if (result.docs.length === 1) {
                if (isRelatedToManyCollections) {
                  results.push({
                    relationTo: relatedCollectionSlug,
                    value: {
                      ...result.docs[0],
                      collection: relatedCollectionSlug,
                    },
                  });
                } else {
                  results.push(result.docs[0]);
                }
              }
            };

            if (value) {
              value.forEach((relatedDoc) => {
                resultPromises.push(createPopulationPromise(relatedDoc));
              });
            }

            await Promise.all(resultPromises);
            return results;
          }

          let id = value;
          if (isRelatedToManyCollections && value) {
            id = value.value;
            relatedCollectionSlug = value.relationTo;
          }

          if (id) {
            id = id.toString();

            const relatedDocumentQuery = {
              collection: collections[relatedCollectionSlug],
              where: {
                ...(args.where || {}),
                id: {
                  equals: id,
                },
              },
              req: context,
            };

            if (args.page) relatedDocumentQuery.paginate.page = args.page;
            if (args.limit) relatedDocumentQuery.paginate.limit = args.limit;

            const relatedDocument = await find(relatedDocumentQuery);

            if (relatedDocument.docs[0]) {
              if (isRelatedToManyCollections) {
                return {
                  relationTo: relatedCollectionSlug,
                  value: {
                    ...relatedDocument.docs[0],
                    collection: relatedCollectionSlug,
                  },
                };
              }

              return relatedDocument.docs[0];
            }

            return null;
          }

          return null;
        },
      };

      if (hasManyValues) {
        relationship.args.page = { type: GraphQLInt };
        relationship.args.limit = { type: GraphQLInt };
      }

      if (isRelatedToManyCollections) {
        const relatedCollectionFields = relationTo.reduce((allFields, relation) => [
          ...allFields,
          ...collections[relation].config.fields,
        ], []);

        relationship.args.where = {
          type: this.buildWhereInputType(
            relationshipName,
            relatedCollectionFields,
            relationshipName,
          ),
        };
      } else {
        const whereFields = this.collections[relationTo].config.fields;

        relationship.args.where = {
          type: this.buildWhereInputType(
            relationshipName,
            whereFields,
            relationshipName,
          ),
        };
      }

      return relationship;
    },
    array: (field) => {
      const fullName = combineParentName(parentName, field.label);
      let type = recursiveBuildObjectType(fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type));

      return { type };
    },
    group: (field) => {
      const fullName = combineParentName(parentName, field.label);
      const type = recursiveBuildObjectType(fullName, field.fields, fullName);

      return { type };
    },
    blocks: (field) => {
      const blockTypes = field.blocks.map((block) => {
        this.buildBlockType(block);
        return this.types.blockTypes[block.slug];
      });

      const type = new GraphQLList(new GraphQLUnionType({
        name: combineParentName(parentName, field.label),
        types: blockTypes,
        resolveType: (data) => this.types.blockTypes[data.blockType],
      }));

      return { type };
    },
    row: (field) => field.fields.reduce((subFieldSchema, subField) => {
      const buildSchemaType = fieldToSchemaMap[subField.type];

      if (buildSchemaType) {
        return {
          ...subFieldSchema,
          [formatName(subField.name)]: buildSchemaType(subField),
        };
      }

      return subFieldSchema;
    }, {}),
  };

  const objectSchema = {
    name,
    fields: () => fields.reduce((schema, field) => {
      const fieldSchema = fieldToSchemaMap[field.type];
      if (fieldSchema) {
        if (field.name) {
          return {
            ...schema,
            [formatName(field.name)]: fieldSchema(field),
          };
        }

        return {
          ...schema,
          ...fieldSchema(field),
        };
      }

      return schema;
    }, baseFields),
  };

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema);

  return newlyCreatedBlockType;
}

module.exports = buildObjectType;
