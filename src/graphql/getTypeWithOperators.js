const { GraphQLObjectType } = require('graphql');
const combineParentName = require('./combineParentName');

const getTypeWithOperators = (field, type, parent, operators) => {
  const fullName = combineParentName(parent, field.label);
  return new GraphQLObjectType({
    name: fullName,
    fields: operators.reduce((fields, operator) => {
      return {
        ...fields,
        [operator]: { type },
      },
    }, {}),
  });
}

module.exports = getTypeWithOperators;
