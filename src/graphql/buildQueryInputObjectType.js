const {
  GraphQLString,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLInterfaceType,
  GraphQLEnumType,
  GraphQLObjectType,
} = require('graphql');

const formatName = require('./formatName');
const combineParentName = require('./combineParentName');
const getTypeWithOperators = require('./getTypeWithOperators');

const buildQueryInputObjectType = ({ name, fields, parent }) => {
  const fieldToSchemaMap = {
    number: (field) => {
      const type = GraphQLFloat;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'gte', 'gt', 'lte', 'lt', 'ne'],
        ),
      };
    },
    text: (field) => {
      const type = GraphQLString;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'ne'],
        ),
      };
    },
    email: (field) => {
      const type = GraphQLString;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'ne'],
        ),
      };
    },
    textarea: (field) => {
      const type = GraphQLString;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'ne'],
        ),
      };
    },
    WYSIWYG: (field) => {
      const type = GraphQLString;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'ne'],
        ),
      };
    },
    code: (field) => {
      const type = GraphQLString;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'ne'],
        ),
      };
    },
    date: (field) => {
      const type = GraphQLString;
      return {
        type: getTypeWithOperators(
          field,
          type,
          parent,
          ['equals', 'like', 'ne'],
        ),
      };
    },
    upload: () => {
      const type = GraphQLString;
      return {
        type,
      };
    },
    checkbox: field => ({
      type: getTypeWithOperators(
        field,
        GraphQLBoolean,
        parent,
        ['equals', 'ne'],
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
      const fullName = combineParentName(parent, field.label);

      const type = buildObjectType(config, {
        name: fullName,
        fields: field.fields,
        parent: fullName,
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

module.exports = buildQueryInputObjectType;
