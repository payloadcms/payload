import { GraphQLBoolean, GraphQLInputObjectType, GraphQLString, GraphQLList, GraphQLFloat, GraphQLEnumType, GraphQLInt } from 'graphql';
import type { GraphQLType } from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import { FieldAffectingData, NumberField, RadioField, SelectField, optionIsObject } from '../../fields/config/types';
import combineParentName from '../utilities/combineParentName';
import formatName from '../utilities/formatName';
import operators from './operators';

type staticTypes = 'number' | 'text' | 'email' | 'textarea' | 'richText' | 'json' | 'code' | 'checkbox' | 'date' | 'upload' | 'point' | 'relationship'

type dynamicTypes = 'radio' | 'select'

type DefaultsType = {
  [key in staticTypes]: {
    operators: {
      operator: string;
      type: GraphQLType | ((field: FieldAffectingData, parentName: string) => GraphQLType);
    }[];
  }
} & {
  [key in dynamicTypes]: {
    operators: {
      operator: string;
      type: ((field: FieldAffectingData, parentName: string) => GraphQLType);
    }[];
  }
}

const defaults: DefaultsType = {
  number: {
    operators: [
      ...[...operators.equality, ...operators.comparison].map((operator) => ({
        operator,
        type: (field: NumberField): GraphQLType => {
          return field?.name === 'id' ? GraphQLInt : GraphQLFloat;
        },
      })),
    ],
  },
  text: {
    operators: [
      ...[...operators.equality, ...operators.partial, ...operators.contains].map((operator) => ({
        operator,
        type: GraphQLString,
      })),
    ],
  },
  email: {
    operators: [
      ...[...operators.equality, ...operators.partial, ...operators.contains].map((operator) => ({
        operator,
        type: EmailAddressResolver,
      })),
    ],
  },
  textarea: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        operator,
        type: GraphQLString,
      })),
    ],
  },
  richText: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        operator,
        type: GraphQLJSON,
      })),
    ],
  },
  json: {
    operators: [
      ...[...operators.equality, ...operators.partial, ...operators.geojson].map((operator) => ({
        operator,
        type: GraphQLJSON,
      })),
    ],
  },
  code: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        operator,
        type: GraphQLString,
      })),
    ],
  },
  radio: {
    operators: [
      ...[...operators.equality, ...operators.partial].map((operator) => ({
        operator,
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
      })),
    ],
  },
  date: {
    operators: [
      ...[...operators.equality, ...operators.comparison, 'like'].map((operator) => ({
        operator,
        type: DateTimeResolver,
      })),
    ],
  },
  point: {
    operators: [
      ...[...operators.equality, ...operators.comparison, ...operators.geo].map((operator) => ({
        operator,
        type: new GraphQLList(GraphQLFloat),
      })),
      ...operators.geojson.map((operator) => ({
        operator,
        type: GraphQLJSON,
      })),
    ],
  },
  relationship: {
    operators: [
      ...[...operators.equality, ...operators.contains].map((operator) => ({
        operator,
        type: GraphQLString,
      })),
    ],
  },
  upload: {
    operators: [
      ...operators.equality.map((operator) => ({
        operator,
        type: GraphQLString,
      })),
    ],
  },
  checkbox: {
    operators: [
      ...operators.equality.map((operator) => ({
        operator,
        type: GraphQLBoolean,
      })),
    ],
  },
  select: {
    operators: [
      ...[...operators.equality, ...operators.contains].map((operator) => ({
        operator,
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
      })),
    ],
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

  if (!('required' in field) || !field.required) {
    fieldOperators.push({
      operator: 'exists',
      type: fieldOperators[0].type,
    });
  }


  return new GraphQLInputObjectType({
    name,
    fields: fieldOperators.reduce((objectTypeFields, operator) => {
      let gqlType: GraphQLType = typeof operator.type === 'function'
        ? operator.type(field, parentName)
        : operator.type;

      if (listOperators.includes(operator.operator)) {
        gqlType = new GraphQLList(gqlType);
      } else if (operator.operator === 'exists') {
        gqlType = GraphQLBoolean;
      }

      return {
        ...objectTypeFields,
        [operator.operator]: {
          type: gqlType,
        },
      };
    }, {}),
  });
};
