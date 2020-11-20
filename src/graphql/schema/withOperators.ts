import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList } from 'graphql';
import combineParentName from '../utilities/combineParentName';

const withOperators = (field, type, parent, operators) => {
  const name = `${combineParentName(parent, field.name)}_operator`;
  const listOperators = ['in', 'not_in', 'all'];

  if (!field.required) operators.push('exists');

  return new GraphQLInputObjectType({
    name,
    fields: operators.reduce((fields, operator) => {
      let gqlType;
      if (listOperators.indexOf(operator) > -1) {
        gqlType = new GraphQLList(type);
      } else if (operator === 'exists') {
        gqlType = GraphQLBoolean;
      } else {
        gqlType = type;
      }
      return {
        ...fields,
        [operator]: {
          type: gqlType,
        },
      };
    }, {}),
  });
};

export default withOperators;
