import { GraphQLBoolean, GraphQLInputObjectType, GraphQLString, GraphQLList, GraphQLFloat, GraphQLEnumType } from 'graphql';
import type { GraphQLType } from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import { FieldAffectingData, RadioField, SelectField, optionIsObject } from '../../fields/config/types';
import combineParentName from '../utilities/combineParentName';
import formatName from '../utilities/formatName';
import operators from './operators';

type staticTypes = 'number' | 'text' | 'email' | 'textarea' | 'richText' | 'json' | 'code' | 'checkbox' | 'date' | 'upload' | 'point' | 'relationship'

type DefaultsType = {
  [key in staticTypes]: {
    type: GraphQLType | ((field: FieldAffectingData, parentName: string) => GraphQLType);
    operators: string[];
  }
} & {
  radio: {
    type: (field: FieldAffectingData, parentName: string) => GraphQLType;
    operators: string[];
  }
  select: {
    type: (field: FieldAffectingData, parentName: string) => GraphQLType;
    operators: string[];
  }
}

const defaults: DefaultsType = {
  number: {
    type: GraphQLFloat,
    operators: [...operators.equality, ...operators.comparison],
  },
  text: {
    type: GraphQLString,
    operators: [...operators.equality, ...operators.partial, ...operators.contains],
  },
  email: {
    type: EmailAddressResolver,
    operators: [...operators.equality, ...operators.partial, ...operators.contains],
  },
  textarea: {
    type: GraphQLString,
    operators: [...operators.equality, ...operators.partial],
  },
  richText: {
    type: GraphQLJSON,
    operators: [...operators.equality, ...operators.partial],
  },
  json: {
    type: GraphQLJSON,
    operators: [...operators.equality, ...operators.partial],
  },
  code: {
    type: GraphQLString,
    operators: [...operators.equality, ...operators.partial],
  },
  radio: {
    type: (field: RadioField, parentName): GraphQLType => new GraphQLEnumType({
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
    }),
    operators: [...operators.equality, ...operators.contains],
  },
  date: {
    type: DateTimeResolver,
    operators: [...operators.equality, ...operators.comparison, 'like'],
  },
  point: {
    type: new GraphQLList(GraphQLFloat),
    operators: [...operators.equality, ...operators.comparison, ...operators.geo],
  },
  relationship: {
    type: GraphQLString,
    operators: [...operators.equality, ...operators.comparison],
  },
  upload: {
    type: GraphQLString,
    operators: [...operators.equality],
  },
  checkbox: {
    type: GraphQLBoolean,
    operators: [...operators.equality],
  },
  select: {
    type: (field: SelectField, parentName): GraphQLType => new GraphQLEnumType({
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
    }),
    operators: [...operators.equality, ...operators.contains],
  },
  // array: n/a
  // group: n/a
  // row: n/a
  // collapsible: n/a
  // tabs: n/a
};

const listOperators = ['in', 'not_in', 'all'];

export const withOperators = (field: FieldAffectingData, parentName: string): GraphQLInputObjectType => {
  if (!defaults?.[field.type]) throw new Error(`Error: ${field.type} has no defaults configured.`);

  const name = `${combineParentName(parentName, field.name)}_operator`;

  const fieldOperators = [...defaults[field.type].operators];
  if (!('required' in field) || !field.required) fieldOperators.push('exists');

  let gqlType: GraphQLType = typeof defaults[field.type].type === 'function'
    ? defaults[field.type].type(field, parentName)
    : defaults?.[field.type].type;

  return new GraphQLInputObjectType({
    name,
    fields: fieldOperators.reduce((objectTypeFields, operator) => {
      if (listOperators.includes(operator)) {
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
