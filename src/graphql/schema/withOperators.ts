import { GraphQLBoolean, GraphQLInputObjectType, GraphQLString, GraphQLList, GraphQLType, GraphQLFloat, GraphQLEnumType } from 'graphql';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import GraphQLJSON from 'graphql-type-json';
import { FieldAffectingData, optionIsObject } from '../../fields/config/types';
import combineParentName from '../utilities/combineParentName';
import formatName from '../utilities/formatName';
import operators from './operators';

const defaultTypes = {
  number: GraphQLString,
  text: GraphQLString,
  email: EmailAddressResolver,
  textarea: GraphQLString,
  richText: GraphQLJSON,
  json: GraphQLJSON,
  code: GraphQLString,
  // radio: implemented below
  date: DateTimeResolver,
  point: new GraphQLList(GraphQLFloat),
  relationship: GraphQLString,
  upload: GraphQLString,
  checkbox: GraphQLBoolean,
  // select: implemented below
  // array: n/a
  // group: n/a
  // row: n/a
  // collapsible: n/a
  // tabs: n/a
};

const defaultOperators = {
  number: [...operators.equality, ...operators.comparison],
  text: [...operators.equality, ...operators.partial, ...operators.contains],
  email: [...operators.equality, ...operators.partial, ...operators.contains],
  textarea: [...operators.equality, ...operators.partial],
  richText: [...operators.equality, ...operators.partial],
  code: [...operators.equality, ...operators.partial],
  json: [...operators.equality, ...operators.partial],
  radio: [...operators.equality, operators.contains],
  date: [...operators.equality, ...operators.comparison, 'like'],
  point: [...operators.equality, ...operators.comparison, ...operators.geo],
  relationship: [...operators.equality, ...operators.comparison],
};

const listOperators = ['in', 'not_in', 'all'];

const withOperators = (field: FieldAffectingData, parentName: string): GraphQLInputObjectType => {
  const name = `${combineParentName(parentName, field.name)}_operator`;

  const operatorsToUse = defaultOperators[field.type];
  if (!('required' in field) || !field.required) operatorsToUse.push('exists');

  let gqlType: GraphQLType = defaultTypes?.[field.type];

  if (field.type === 'select') {
    gqlType = new GraphQLEnumType({
      name: `${combineParentName(parentName, field.name)}_Input`,
      values: field.options.reduce((values, option) => {
        if (typeof option === 'object' && option.value) {
          return {
            ...values,
            [formatName(option.value)]: {
              value: option.value,
            },
          };
        }

        if (typeof option === 'string') {
          return {
            ...values,
            [option]: {
              value: option,
            },
          };
        }

        return values;
      }, {}),
    });
  }

  if (field.type === 'radio') {
    gqlType = new GraphQLEnumType({
      name: `${combineParentName(parentName, field.name)}_Input`,
      values: field.options.reduce((values, option) => {
        if (optionIsObject(option)) {
          return {
            ...values,
            [formatName(option.value)]: {
              value: option.value,
            },
          };
        }

        return {
          ...values,
          [formatName(option)]: {
            value: option,
          },
        };
      }, {}),
    });
  }

  return new GraphQLInputObjectType({
    name,
    fields: operatorsToUse.reduce((objectTypeFields, operator) => {
      if (listOperators.indexOf(operator) > -1) {
        gqlType = new GraphQLList(gqlType);
      } else if (operator === 'exists') {
        gqlType = GraphQLBoolean;
      }

      return {
        ...objectTypeFields,
        [operator]: {
          type: gqlType,
        },
      };
    }, {}),
  });
};

export default withOperators;
