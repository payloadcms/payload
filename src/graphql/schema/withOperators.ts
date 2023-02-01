import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList, GraphQLType } from 'graphql';
import { FieldAffectingData } from '../../fields/config/types';
import combineParentName from '../utilities/combineParentName';

const withOperators = (field: FieldAffectingData, type: GraphQLType, parentName: string, operators: string[]): GraphQLInputObjectType => {
  const name = `${combineParentName(parentName, field.name)}_operator`;
  const listOperators = ['in', 'not_in', 'all'];

  if (!('required' in field) || !field.required) operators.push('exists');

  return new GraphQLInputObjectType({
    name,
    fields: operators.reduce((fields, operator) => {
      let gqlType: GraphQLType;
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
