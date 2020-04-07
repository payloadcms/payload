/* eslint-disable no-use-before-define */
const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLUnionType,
  GraphQLEnumType,
} = require('graphql');

const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');
const withNullableType = require('./withNullableType');

function getBuildObjectType(context) {
  const buildObjectType = (name, fields, parent, resolver) => {
    const fieldToSchemaMap = {
      number: field => ({ type: withNullableType(field, GraphQLFloat) }),
      text: field => ({ type: withNullableType(field, GraphQLString) }),
      email: field => ({ type: withNullableType(field, GraphQLString) }),
      textarea: field => ({ type: withNullableType(field, GraphQLString) }),
      WYSIWYG: field => ({ type: withNullableType(field, GraphQLString) }),
      code: field => ({ type: withNullableType(field, GraphQLString) }),
      date: field => ({ type: withNullableType(field, GraphQLString) }),
      upload: field => ({ type: withNullableType(field, GraphQLString) }),
      checkbox: field => ({ type: withNullableType(field, GraphQLBoolean) }),
      select: (field) => {
        const fullName = combineParentName(parent, field.name);

        let type = new GraphQLEnumType({
          name: fullName,
          values: field.options.reduce((values, option) => {
            if (typeof option === 'object' && option.value) {
              return {
                ...values,
                [formatName(option.label)]: {
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
        let type;

        if (Array.isArray(relationTo)) {
          const types = relationTo.map((relation) => {
            return context.collections[relation].graphQLType;
          });

          type = new GraphQLUnionType({
            name: combineParentName(parent, label),
            types,
            resolveType(data) {
              return context.types.blockTypes[data.blockType];
            },
          });
        } else {
          type = context.collections[relationTo].graphQLType;
        }

        // If the relationshipType is undefined at this point,
        // it can be assumed that this blockType can have a relationship
        // to itself. Therefore, we set the relationshipType equal to the blockType
        // that is currently being created.

        type = type || newlyCreatedBlockType;

        return {
          type: field.hasMany ? new GraphQLList(type) : type,
        };
      },
      repeater: (field) => {
        const fullName = combineParentName(parent, field.label);
        let type = buildObjectType(fullName, field.fields, fullName);
        type = new GraphQLList(withNullableType(field, type));

        return { type };
      },
      group: (field) => {
        const fullName = combineParentName(parent, field.label);
        const type = buildObjectType(fullName, field.fields, fullName);

        return { type };
      },
      flexible: (field) => {
        const blockTypes = field.blocks.map((block) => {
          context.buildBlockTypeIfMissing(block);
          return context.types.blockTypes[block.slug];
        });

        const type = new GraphQLList(new GraphQLUnionType({
          name: combineParentName(parent, field.label),
          types: blockTypes,
          resolveType(data) {
            return context.types.blockTypes[data.blockType];
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

    if (resolver) {
      objectSchema.resolve = resolver;
    }

    const newlyCreatedBlockType = new GraphQLObjectType(objectSchema);

    return newlyCreatedBlockType;
  };

  return buildObjectType;
}

module.exports = getBuildObjectType;
