const { GraphQLJSONObject } = require('graphql-type-json');
const { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } = require('graphql');
const formatName = require('../utilities/formatName');

const buildFields = (label, fieldsToBuild) => {
  return fieldsToBuild.reduce((builtFields, field) => {
    if (field.name) {
      const fieldName = formatName(field.name);

      if (field.fields) {
        return {
          ...builtFields,
          [field.name]: {
            type: new GraphQLObjectType({
              name: `${label}${fieldName}Fields`,
              fields: buildFields(`${label}${fieldName}`, field.fields),
            }),
          },
        };
      }

      return {
        ...builtFields,
        [field.name]: {
          type: new GraphQLObjectType({
            name: `${label}${fieldName}Policies`,
            fields: ['create', 'read', 'update', 'delete'].reduce((operations, operation) => {
              const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

              return {
                ...operations,
                [operation]: {
                  type: new GraphQLObjectType({
                    name: `${label}${fieldName}${capitalizedOperation}Policy`,
                    fields: {
                      permission: {
                        type: new GraphQLNonNull(GraphQLBoolean),
                      },
                    },
                  }),
                },
              };
            }, {}),
          }),
        },
      };
    }

    if (!field.name && field.fields) {
      const subFields = buildFields(label, field.fields);

      return {
        ...builtFields,
        ...subFields,
      };
    }

    return builtFields;
  }, {});
};

const buildEntity = (label, entityFields, operations) => {
  const formattedLabel = formatName(label);

  const fields = {
    fields: {
      type: new GraphQLObjectType({
        name: formatName(`${formattedLabel}Fields`),
        fields: buildFields(`${formattedLabel}Fields`, entityFields),
      }),
    },
  };

  operations.forEach((operation) => {
    const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

    fields[operation] = {
      type: new GraphQLObjectType({
        name: `${formattedLabel}${capitalizedOperation}Policy`,
        fields: {
          permission: { type: new GraphQLNonNull(GraphQLBoolean) },
          where: { type: GraphQLJSONObject },
        },
      }),
    };
  });

  return fields;
};

function buildPoliciesType() {
  const fields = {
    canAccessAdmin: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  };

  Object.values(this.config.collections).forEach((collection) => {
    fields[formatName(collection.slug)] = {
      type: new GraphQLObjectType({
        name: formatName(`${collection.labels.singular}Policy`),
        fields: buildEntity(collection.labels.singular, collection.fields, ['create', 'read', 'update', 'delete']),
      }),
    };
  });

  Object.values(this.config.globals).forEach((global) => {
    fields[formatName(global.slug)] = {
      type: new GraphQLObjectType({
        name: formatName(`${global.label}Policy`),
        fields: buildEntity(global.label, global.fields, ['read', 'update']),
      }),
    };
  });

  return new GraphQLObjectType({
    name: 'Policies',
    fields,
  });
}

module.exports = buildPoliciesType;
