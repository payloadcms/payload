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

const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');
const withNullableType = require('./withNullableType');
const find = require('../../collections/queries/find');

function buildObjectType(name, fields, parentName) {
  const fieldToSchemaMap = {
    number: field => ({ type: withNullableType(field, GraphQLFloat) }),
    text: field => ({ type: withNullableType(field, GraphQLString) }),
    email: field => ({ type: withNullableType(field, GraphQLString) }),
    textarea: field => ({ type: withNullableType(field, GraphQLString) }),
    wysiwyg: field => ({ type: withNullableType(field, GraphQLString) }),
    code: field => ({ type: withNullableType(field, GraphQLString) }),
    date: field => ({ type: withNullableType(field, GraphQLString) }),
    upload: field => ({ type: withNullableType(field, GraphQLString) }),
    checkbox: field => ({ type: withNullableType(field, GraphQLBoolean) }),
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
              [option]: {
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

      if (isRelatedToManyCollections) {
        const types = relationTo.map((relation) => {
          return this.collections[relation].graphQL.type;
        });

        type = new GraphQLUnionType({
          name: relationshipName,
          types,
          resolveType(data) {
            return this.types.blockTypes[data.blockType];
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

      const relationship = {
        type: hasManyValues ? new GraphQLList(type) : type,
        args: {
          locale: {
            type: this.types.localeInputType,
          },
          fallbackLocale: {
            type: this.types.fallbackLocaleInputType,
          },
        },
        async resolve(parent, args, context) {
          const value = parent[field.name];
          const locale = args.locale || context.locale;
          const fallbackLocale = args.fallbackLocale || context.fallbackLocale;
          let relatedCollectionSlug = field.relationTo;

          if (hasManyValues) {
            const results = [];

            if (value) {
              for (const relatedDoc of value) {
                let id = relatedDoc;

                if (isRelatedToManyCollections) {
                  relatedCollectionSlug = relatedDoc.relationTo;
                  id = relatedDoc.value;
                }

                const result = await find({
                  model: this.collections[relatedCollectionSlug].model,
                  query: {
                    where: {
                      ...(args.where || {}),
                      _id: {
                        equals: id,
                      },
                    },
                  },
                  locale,
                  fallbackLocale,
                });

                if (result.docs.length === 1) {
                  results.push(result.docs[0]);
                }
              }
            }

            return results;
          }

          let id = value;
          if (isRelatedToManyCollections && value) id = value.value;

          if (id) {
            id = id.toString();

            const relatedDocumentQuery = {
              model: this.collections[relatedCollectionSlug].model,
              query: {
                where: {
                  ...(args.where || {}),
                  _id: {
                    equals: id,
                  },
                },
              },
              paginate: {},
              locale,
              fallbackLocale,
            };

            if (args.page) relatedDocumentQuery.paginate.page = args.page;
            if (args.limit) relatedDocumentQuery.paginate.limit = args.limit;

            const relatedDocument = await find();

            if (relatedDocument.docs[0]) return relatedDocument.docs[0];

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
        const relatedCollectionFields = relationTo.reduce((allFields, relation) => {
          return [
            ...allFields,
            ...this.collections[relation].config.fields,
          ];
        }, []);

        relationship.args.where = {
          type: this.buildWhereInputType(
            relationshipName,
            relatedCollectionFields,
            relationshipName,
          ),
        };
      } else {
        relationship.args.where = {
          type: this.buildWhereInputType(
            relationshipName,
            this.collections[relationTo].config.fields,
            relationshipName,
          ),
        };
      }

      return relationship;
    },
    repeater: (field) => {
      const fullName = combineParentName(parentName, field.label);
      let type = buildObjectType(fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type));

      return { type };
    },
    group: (field) => {
      const fullName = combineParentName(parentName, field.label);
      const type = buildObjectType(fullName, field.fields, fullName);

      return { type };
    },
    flexible: (field) => {
      const blockTypes = field.blocks.map((block) => {
        this.buildBlockType(block);
        return this.types.blockTypes[block.slug];
      });

      const type = new GraphQLList(new GraphQLUnionType({
        name: combineParentName(parentName, field.label),
        types: blockTypes,
        resolveType: (data) => {
          return this.types.blockTypes[data.blockType];
        },
      }));

      return { type };
    },
  };

  const objectSchema = {
    name,
    fields: () => fields.reduce((schema, field) => {
      const fieldSchema = fieldToSchemaMap[field.type];
      if (fieldSchema) {
        return {
          ...schema,
          [field.name]: fieldSchema(field),
        };
      }

      return schema;
    }, {}),
  };

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema);

  return newlyCreatedBlockType;
}

module.exports = buildObjectType;
