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

function getBuildObjectType(config, graphQL) {
  const withLocalizedType = (field, type) => {
    if (config.localization && field.localized) {
      if (type instanceof GraphQLObjectType) {
        const LocaleObjectType = graphQL.buildLocaleObjectType(field, type);
        return LocaleObjectType;
      }

      if (type === GraphQLString) {
        return graphQL.types.LocaleStringType;
      }

      if (type === GraphQLFloat) {
        return graphQL.types.LocaleFloatType;
      }
    }

    return type;
  };

  const buildObjectType = (name, fields, parent) => {
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
        const type = GraphQLString;
        const typeWithLocale = withLocalizedType(
          field,
          withNullableType(field, type),
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
        const blockTypeOptions = field.blocks.map(block => block.slug);

        field.blocks.forEach((block) => {
          if (graphQL.types.blockTypes[block.slug] === undefined) {
            const formattedBlockName = formatName(block.labels.singular);

            graphQL.addBlockType(buildObjectType(
              formattedBlockName,
              [
                ...block.fields,
                {
                  name: 'blockName',
                  type: 'text',
                },
                {
                  name: 'blockType',
                  type: 'select',
                  options: blockTypeOptions,
                },
              ],
              formattedBlockName,
            ), block.slug);
          }
        });

        return {
          type: withLocalizedType(
            field,
            new GraphQLList(
              new GraphQLUnionType({
                name: combineParentName(parent, field.label),
                types: field.blocks.map(blockType => graphQL.types.blockTypes[blockType.slug]),
                resolveType(data) {
                  return graphQL.types.blockTypes[data.blockType];
                },
              }),
            ),
          ),
        };
      },
    };

    return new GraphQLObjectType({
      name,
      fields: fields.reduce((schema, field) => {
        const fieldSchema = fieldToSchemaMap[field.type];
        if (fieldSchema) {
          return {
            ...schema,
            [field.name]: fieldSchema(field),
          };
        }

        return schema;
      }, {}),
    });
  };

  return buildObjectType;
}

module.exports = getBuildObjectType;
