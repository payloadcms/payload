const { GraphQLJSONObject } = require('graphql-type-json');
const { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } = require('graphql');
const formatName = require('../utilities/formatName');

const buildCollectionFields = (collection) => {
  const fields = {};
  const operations = ['create', 'read', 'update', 'delete'];

  operations.forEach((operation) => {
    const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1);

    fields[operation] = {
      type: new GraphQLObjectType({
        name: formatName(`${collection.labels.singular}${capitalizedOperation}Policy`),
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
    fields[collection.slug] = {
      type: new GraphQLObjectType({
        name: formatName(`${collection.labels.singular}Policy`),
        fields: buildCollectionFields(collection),
      }),
    };
  });

  return new GraphQLObjectType({
    name: 'Policies',
    fields,
  });
}

module.exports = buildPoliciesType;
