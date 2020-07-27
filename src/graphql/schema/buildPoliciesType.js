const { GraphQLJSONObject } = require('graphql-type-json');
const { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } = require('graphql');
const formatName = require('../utilities/formatName');

const buildFields = (label, fieldsToBuild) => fieldsToBuild.reduce((builtFields, field) => {
  if (field.name) {
    const fieldName = formatName(field.name);

    const objectTypeFields = ['create', 'read', 'update', 'delete'].reduce((operations, operation) => {
      const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

      return {
        ...operations,
        [operation]: {
          type: new GraphQLObjectType({
            name: `${label}_${fieldName}_${capitalizedOperation}`,
            fields: {
              permission: {
                type: new GraphQLNonNull(GraphQLBoolean),
              },
            },
          }),
        },
      };
    }, {});

    if (field.fields) {
      objectTypeFields.fields = {
        type: new GraphQLObjectType({
          name: `${label}_${fieldName}_Fields`,
          fields: buildFields(`${label}_${fieldName}`, field.fields),
        }),
      };
    }

    return {
      ...builtFields,
      [field.name]: {
        type: new GraphQLObjectType({
          name: `${label}_${fieldName}`,
          fields: objectTypeFields,
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
        name: `${formattedLabel}${capitalizedOperation}Access`,
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
        name: formatName(`${collection.labels.singular}Access`),
        fields: buildEntity(collection.labels.singular, collection.fields, ['create', 'read', 'update', 'delete']),
      }),
    };
  });

  Object.values(this.config.globals).forEach((global) => {
    fields[formatName(global.slug)] = {
      type: new GraphQLObjectType({
        name: formatName(`${global.label}Access`),
        fields: buildEntity(global.label, global.fields, ['read', 'update']),
      }),
    };
  });

  return new GraphQLObjectType({
    name: 'Access',
    fields,
  });
}

module.exports = buildPoliciesType;
