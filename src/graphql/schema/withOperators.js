const { GraphQLList, GraphQLInputObjectType } = require('graphql');
const combineParentName = require('../utilities/combineParentName');

const withOperators = (fieldName, type, parent, operators) => {
  const name = `${combineParentName(parent, fieldName)}_operator`;
  const listOperators = ['in', 'not_in', 'all'];

  return new GraphQLInputObjectType({
    name,
    fields: operators.reduce((fields, operator) => {
      return {
        ...fields,
        [operator]: {
          type: listOperators.indexOf(operator) > -1 ? new GraphQLList(type) : type,
        },
      };
    }, {}),
  });
};

module.exports = withOperators;
