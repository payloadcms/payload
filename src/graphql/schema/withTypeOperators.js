const { GraphQLInputObjectType } = require('graphql');
const combineParentName = require('../utilities/combineParentName');

const getTypeWithOperators = (field, type, parent, operators) => {
  const fullName = `${combineParentName(parent, field.label)}_Operator`;
  return new GraphQLInputObjectType({
    name: fullName,
    fields: operators.reduce((fields, operator) => {
      return {
        ...fields,
        [operator]: { type },
      };
    }, {}),
  });
};

module.exports = getTypeWithOperators;
