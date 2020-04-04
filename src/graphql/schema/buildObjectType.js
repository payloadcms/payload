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

const formatName = require('../utilities/formatName');
const combineParentName = require('../utilities/combineParentName');
const withNullableType = require('./withNullableType');

const buildObjectType = (config, { name, fields, parent }) => {
  const getLocalizedType = (field, type) => {
    if (config.localization && field.localized) {
      return new GraphQLObjectType({
        name: `${combineParentName(parent, field.label)}_Locale`,
        fields: config.localization.locales.reduce((localeFields, locale) => {
          return {
            ...localeFields,
            [locale]: { type },
          };
        }, {}),
      });
    }

    return type;
  };

  const fieldToSchemaMap = {
    number: (field) => {
      const type = GraphQLFloat;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    text: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    email: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    textarea: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    WYSIWYG: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    code: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    date: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
        ),
      };
    },
    upload: (field) => {
      const type = GraphQLString;
      return {
        type: getLocalizedType(
          field,
          withNullableType(field, type),
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
        withNullableType(field, type),
      );

      return {
        type: field.hasMany ? new GraphQLList(typeWithLocale) : typeWithLocale,
      };
    },
    repeater: (field) => {
      const fullName = combineParentName(parent, field.label);

      const type = buildObjectType(config, {
        name: fullName,
        fields: field.fields,
        parent: fullName,
      });

      const typeWithNullable = new GraphQLList(withNullableType(field, type));

      return {
        type: getLocalizedType(
          field,
          typeWithNullable,
        ),
      };
    },
    group: (field) => {
      const fullName = combineParentName(parent, field.label);

      const type = buildObjectType(config, {
        name: fullName,
        fields: field.fields,
        parent: fullName,
      });

      return {
        type,
      };
    },
    select: (field) => {
      const fullName = combineParentName(parent, field.label);

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
        type: getLocalizedType(
          field,
          typeWithNullable,
        ),
      };
    },
    flexible: (field) => {
      const blockTypes = field.blocks.reduce((blocks, block) => {
        const formattedBlockName = formatName(block.labels.singular);
        const fullName = `${combineParentName(parent, field.label)}_${formattedBlockName}`;
        return {
          ...blocks,
          [block.slug]: buildObjectType(config, {
            name: fullName,
            fields: block.fields,
            parent: fullName,
          }),
        };
      }, {});

      return {
        type: getLocalizedType(
          field,
          new GraphQLList(new GraphQLInterfaceType({
            name: combineParentName(parent, field.label),
            fields: {
              blockType: {
                type: new GraphQLEnumType({
                  name: `${combineParentName(parent, field.label)}_BlockType`,
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
        ),
      };
    },
  };

  return new GraphQLObjectType({
    name,
    fields: fields.reduce((schema, field) => {
      const fieldName = formatName(field.label);
      return {
        ...schema,
        [fieldName]: fieldToSchemaMap[field.type](field),
      };
    }, {}),
  });
};

module.exports = buildObjectType;
