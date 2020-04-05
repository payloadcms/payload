const { GraphQLInputObjectType } = require('graphql');
const combineParentName = require('../utilities/combineParentName');

const withOperators = (fieldName, type, parent, operators) => {
  const name = `${combineParentName(parent, fieldName)}Operator`;
  return new GraphQLInputObjectType({
    name,
    fields: operators.reduce((fields, operator) => {
      return {
        ...fields,
        [operator]: { type },
      };
    }, {}),
  });
};

module.exports = withOperators;
