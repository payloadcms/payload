/* eslint-disable no-use-before-define */
const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLNonNull,
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
      number: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleFloatType : GraphQLFloat,
          ),
        };
      },
      text: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      email: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      textarea: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      WYSIWYG: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      code: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      date: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      upload: (field) => {
        return {
          type: withNullableType(
            field,
            field.localized ? context.types.LocaleStringType : GraphQLString,
          ),
        };
      },
      checkbox: field => ({
        type: withNullableType(
          field,
          field.localized ? context.types.LocaleBooleanType : GraphQLBoolean,
        ),
      }),
      select: (field) => {
        const fullName = combineParentName(parent, field.name);

        const type = new GraphQLEnumType({
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

        const typeWithList = field.hasMany ? new GraphQLList(type) : type;
        const typeWithNullable = withNullableType(field, typeWithList);

        return {
          type: field.localized ? context.buildLocaleCustomType(field, typeWithNullable, parent) : typeWithNullable,
        };
      },
      relationship: (field) => {
        const { relationTo, label } = field;
        let relationshipType;

        if (Array.isArray(relationTo)) {
          const types = relationTo.map((relation) => {
            return context.collections[relation].graphQLType;
          });

          relationshipType = new GraphQLUnionType({
            name: combineParentName(parent, label),
            types,
            resolveType(data) {
              return context.types.blockTypes[data.blockType];
            },
          });
        } else {
          relationshipType = context.collections[relationTo].graphQLType;
        }

        // If the relationshipType is undefined at this point,
        // it can be assumed that this blockType can have a relationship
        // to itself. Therefore, we set the relationshipType equal to the blockType
        // that is currently being created.

        relationshipType = relationshipType || newlyCreatedBlockType;

        const localizedType = field.localized ? context.buildLocaleCustomType(field, relationshipType, parent) : relationshipType;

        return {
          type: field.hasMany ? new GraphQLList(localizedType) : localizedType,
        };
      },
      repeater: (field) => {
        const fullName = combineParentName(parent, field.label);
        const type = buildObjectType(fullName, field.fields, fullName);
        const typeWithNullable = new GraphQLList(withNullableType(field, type));

        return {
          type: field.localized ? context.buildLocaleCustomType(field, typeWithNullable, parent) : typeWithNullable,
        };
      },
      group: (field) => {
        const fullName = combineParentName(parent, field.label);
        const type = buildObjectType(fullName, field.fields, fullName);

        return {
          type,
        };
      },
      flexible: (field) => {
        const blockTypes = field.blocks.map((block) => {
          context.buildBlockTypeIfMissing(block);
          return context.types.blockTypes[block.slug];
        });

        const flexibleType = new GraphQLList(
          new GraphQLUnionType({
            name: combineParentName(parent, field.label),
            blockTypes,
            resolveType(data) {
              // If the field contains all locales, it's a locale object
              // Send back the locale object type
              // Otherwise, grab the appropriate block type and send that
              if (context.checkIfLocaleObject(data)) {
                return flexibleLocaleObjectType;
              }
              return context.types.blockTypes[data.blockType];
            },
          }),
        );

        const flexibleLocaleObjectType = context.buildLocaleCustomType(field, flexibleType, parent);

        if (field.localized) {
          blockTypes.push(flexibleLocaleObjectType);
          return { type: flexibleLocaleObjectType };
        }

        return flexibleType;
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
