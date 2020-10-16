const { GraphQLList, GraphQLInputObjectType } = require('graphql');
const combineParentName = require('../utilities/combineParentName');

const withOperators = (field, type, parent, operators) => {
  const name = `${combineParentName(parent, field.name)}_operator`;
  const listOperators = ['in', 'not_in', 'all'];

  if (!field.required) {
    console.log('name', field.name);
    operators.push('exists');
  }

  return new GraphQLInputObjectType({
    name,
    fields: operators.reduce((fields, operator) => ({
      ...fields,
      [operator]: {
        type: listOperators.indexOf(operator) > -1 ? new GraphQLList(type) : type,
      },
    }), {}),
  });
};

module.exports = withOperators;
