const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLEnumType,
  GraphQLObjectType,
} = require('graphql');

const buildObjectType = require('./buildObjectType');

const getTypeWithNullable = (field, type) => {
  if (field.required && !field.localized) {
    return new GraphQLNonNull(type);
  }

  return type;
};

const fieldToSchemaMap = (config) => {
  const getLocalizedType = (field, type) => {
    if (config.localization && field.localized) {
      return new GraphQLObjectType({
        name: `${field.name} - Locale`,
        fields: config.localization.locales.reduce((fields, locale) => {
          return {
            ...fields,
            [locale]: type,
          };
        }, {}),
      });
    }

    return type;
  };

  return {
    number: (field) => {
      const type = GraphQLFloat;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    text: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    textarea: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    WYSIWYG: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    code: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    date: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    upload: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          getTypeWithNullable(field, type),
        ),
      };
    },
    checkbox: field => ({
      type: getLocalizedType(
        field,
        new GraphQLNonNull(GraphQLBoolean),
      ),
    }),
    relationship: (field) => {
      const type = GraphQLString;
      const typeWithLocale = getLocalizedType(
        field,
        getTypeWithNullable(field, type),
      );

      return {
        type: field.hasMany ? new GraphQLList(typeWithLocale) : typeWithLocale,
      };
    },
    repeater: (field) => {
      const type = buildObjectType({
        name: field.label,
        fields: field.fields,
      });

      const typeWithNullable = new GraphQLList(getTypeWithNullable(field, type));

      return {
        type: getLocalizedType(
          field,
          typeWithNullable,
        ),
      };
    },
    group: (field) => {
      const type = buildObjectType({
        name: field.label,
        fields: field.fields,
      });

      return {
        type,
      };
    },
    select: (field) => {
      const type = new GraphQLEnumType({
        name: field.name,
        values: field.options.reduce((values, option) => {
          if (typeof option === 'object' && option.value) {
            return {
              ...values,
              [option.label]: {
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
      const typeWithNullable = getTypeWithNullable(field, typeWithList);

      return {
        type: getLocalizedType(
          field,
          typeWithNullable,
        ),
      };
    },
    flexible: (field) => {
      const blockTypes = field.blocks.reduce((blocks, block) => {
        return {
          ...blocks,
          [block.slug]: buildObjectType({
            name: block.labels.singular,
            fields: block.fields,
          }),
        };
      }, {});

      return getLocalizedType(
        field,
        new GraphQLList(new GraphQLInterfaceType({
          name: field.name,
          fields: {
            blockType: {
              type: new GraphQLEnumType({
                name: 'Block Type',
                values: field.blocks.reduce((values, block) => {
                  return {
                    ...values,
                    [block.slug]: {
                      value: block.slug,
                    },
                  };
                }, {}),
              }),
            },
            blockName: { type: GraphQLString },
          },
          resolveType(value) {
            return blockTypes[value.blockType];
          },
        })),
      );
    },
  };
};

module.exports = fieldToSchemaMap;
