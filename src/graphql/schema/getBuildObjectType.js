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
  const withLocalizedType = (field, type) => {
    if (context.config.localization && field.localized) {
      if (type instanceof GraphQLObjectType) {
        const LocaleObjectType = context.buildLocaleObjectType(field, type);
        return LocaleObjectType;
      }

      if (type === GraphQLString) {
        return context.types.LocaleStringType;
      }

      if (type === GraphQLFloat) {
        return context.types.LocaleFloatType;
      }
    }

    return type;
  };

  const buildObjectType = (name, fields, parent, resolver) => {
    const fieldToSchemaMap = {
      number: (field) => {
        return {
          type: withLocalizedType(field, withNullableType(field, GraphQLFloat)),
        };
      },
      text: (field) => {
        return {
          type: withLocalizedType(field, withNullableType(field, GraphQLString)),
        };
      },
      email: (field) => {
        return {
          type: withLocalizedType(
            field,
            withNullableType(field, GraphQLString),
          ),
        };
      },
      textarea: (field) => {
        return {
          type: withLocalizedType(
            field,
            withNullableType(field, GraphQLString),
          ),
        };
      },
      WYSIWYG: (field) => {
        return {
          type: withLocalizedType(
            field,
            withNullableType(field, GraphQLString),
          ),
        };
      },
      code: (field) => {
        return {
          type: withLocalizedType(
            field,
            withNullableType(field, GraphQLString),
          ),
        };
      },
      date: (field) => {
        return {
          type: withLocalizedType(
            field,
            withNullableType(field, GraphQLString),
          ),
        };
      },
      upload: (field) => {
        const type = GraphQLString;
        return {
          type: withLocalizedType(
            field,
            withNullableType(field, type),
          ),
        };
      },
      checkbox: field => ({
        type: withLocalizedType(
          field,
          new GraphQLNonNull(GraphQLBoolean),
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
          type: withLocalizedType(
            field,
            typeWithNullable,
          ),
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

        // eslint-disable-next-line no-use-before-define
        relationshipType = relationshipType || blockType;

        const typeWithLocale = withLocalizedType(
          field,
          withNullableType(field, relationshipType),
        );

        return {
          type: field.hasMany ? new GraphQLList(typeWithLocale) : typeWithLocale,
        };
      },
      repeater: (field) => {
        const fullName = combineParentName(parent, field.label);
        const type = buildObjectType(fullName, field.fields, fullName);
        const typeWithNullable = new GraphQLList(withNullableType(field, type));

        return {
          type: withLocalizedType(
            field,
            typeWithNullable,
          ),
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
        const types = field.blocks.map((block) => {
          context.buildBlockTypeIfMissing(block);
          return context.types.blockTypes[block.slug];
        });

        return {
          type: withLocalizedType(
            field,
            new GraphQLList(
              new GraphQLUnionType({
                name: combineParentName(parent, field.label),
                types,
                resolveType(data) {
                  return context.types.blockTypes[data.blockType];
                },
              }),
            ),
          ),
        };
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

    const blockType = new GraphQLObjectType(objectSchema);

    return blockType;
  };

  return buildObjectType;
}

module.exports = getBuildObjectType;
