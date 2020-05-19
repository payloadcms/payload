const { GraphQLJSONObject } = require('graphql-type-json');
const { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } = require('graphql');
const formatName = require('../utilities/formatName');

const buildFields = (label, operations) => {
  const fields = {};

  operations.forEach((operation) => {
    const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

    fields[operation] = {
      type: new GraphQLObjectType({
        name: formatName(`${label}${capitalizedOperation}Policy`),
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
        fields: buildFields(collection.labels.singular, ['create', 'read', 'update', 'delete']),
      }),
    };
  });

  Object.values(this.config.globals).forEach((global) => {
    fields[formatName(global.slug)] = {
      type: new GraphQLObjectType({
        name: formatName(`${global.label}Policy`),
        fields: buildFields(global.label, ['read', 'update']),
      }),
    };
  });

  return new GraphQLObjectType({
    name: 'Policies',
    fields,
  });
}

module.exports = buildPoliciesType;
