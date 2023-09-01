/* eslint-disable no-use-before-define */
import type {
  GraphQLInputFieldConfig,
  GraphQLScalarType,
  GraphQLType} from 'graphql';

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString
} from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';

import type { SanitizedCollectionConfig } from '../../collections/config/types';
import type { ArrayField, BlockField, CheckboxField, CodeField, CollapsibleField, DateField, EmailField, Field, GroupField, JSONField, NumberField, PointField, RadioField, RelationshipField, RichTextField, RowField, SelectField, TabsField, TextField, TextareaField, UploadField} from '../../fields/config/types';
import type { Payload } from '../../payload';

import { fieldAffectsData, tabHasName } from '../../fields/config/types';
import { toWords } from '../../utilities/formatLabels';
import { groupOrTabHasRequiredSubfield } from '../../utilities/groupOrTabHasRequiredSubfield';
import combineParentName from '../utilities/combineParentName';
import formatName from '../utilities/formatName';
import withNullableType from './withNullableType';

export const getCollectionIDType = (config: SanitizedCollectionConfig): GraphQLScalarType => {
  const idField = config.fields.find((field) => fieldAffectsData(field) && field.name === 'id');
  if (!idField) return GraphQLString;
  switch (idField.type) {
    case 'number':
      return GraphQLInt;
    default:
      return GraphQLString;
  }
};

export type InputObjectTypeConfig = {
  [path: string]: GraphQLInputFieldConfig
}

function buildMutationInputType(payload: Payload, name: string, fields: Field[], parentName: string, forceNullable = false): GraphQLInputObjectType {
  const fieldToSchemaMap = {
    array: (inputObjectTypeConfig: InputObjectTypeConfig, field: ArrayField) => {
      const fullName = combineParentName(parentName, toWords(field.name, true));
      let type: GraphQLList<GraphQLType> | GraphQLType = buildMutationInputType(payload, fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type, forceNullable));
      return {
        ...inputObjectTypeConfig,
        [field.name]: { type },
      };
    },
    blocks: (inputObjectTypeConfig: InputObjectTypeConfig, field: BlockField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: GraphQLJSON },
    }),
    checkbox: (inputObjectTypeConfig: InputObjectTypeConfig, field: CheckboxField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: GraphQLBoolean },
    }),
    code: (inputObjectTypeConfig: InputObjectTypeConfig, field: CodeField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    collapsible: (inputObjectTypeConfig: InputObjectTypeConfig, field: CollapsibleField) => field.fields.reduce((acc, subField: CollapsibleField) => {
      const addSubField = fieldToSchemaMap[subField.type];
      if (addSubField) return addSubField(acc, subField);
      return acc;
    }, inputObjectTypeConfig),
    date: (inputObjectTypeConfig: InputObjectTypeConfig, field: DateField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    email: (inputObjectTypeConfig: InputObjectTypeConfig, field: EmailField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    group: (inputObjectTypeConfig: InputObjectTypeConfig, field: GroupField) => {
      const requiresAtLeastOneField = groupOrTabHasRequiredSubfield(field);
      const fullName = combineParentName(parentName, toWords(field.name, true));
      let type: GraphQLType = buildMutationInputType(payload, fullName, field.fields, fullName);
      if (requiresAtLeastOneField) type = new GraphQLNonNull(type);
      return {
        ...inputObjectTypeConfig,
        [field.name]: { type },
      };
    },
    json: (inputObjectTypeConfig: InputObjectTypeConfig, field: JSONField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLJSON, forceNullable) },
    }),
    number: (inputObjectTypeConfig: InputObjectTypeConfig, field: NumberField) => {
      const type = field.name === 'id' ? GraphQLInt : GraphQLFloat;
      return {
        ...inputObjectTypeConfig,
        [field.name]: { type: withNullableType(field, field.hasMany === true ? new GraphQLList(type) : type, forceNullable) },
      };
    },
    point: (inputObjectTypeConfig: InputObjectTypeConfig, field: PointField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, new GraphQLList(GraphQLFloat), forceNullable) },
    }),
    radio: (inputObjectTypeConfig: InputObjectTypeConfig, field: RadioField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    relationship: (inputObjectTypeConfig: InputObjectTypeConfig, field: RelationshipField) => {
      const { relationTo } = field;
      type PayloadGraphQLRelationshipType = GraphQLInputObjectType | GraphQLList<GraphQLScalarType> | GraphQLScalarType;
      let type: PayloadGraphQLRelationshipType;

      if (Array.isArray(relationTo)) {
        const fullName = `${combineParentName(parentName, toWords(field.name, true))}RelationshipInput`;
        type = new GraphQLInputObjectType({
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${fullName}RelationTo`,
                values: relationTo.reduce((values, option) => ({
                  ...values,
                  [formatName(option)]: {
                    value: option,
                  },
                }), {}),
              }),
            },
            value: { type: GraphQLJSON },
          },
          name: fullName,
        });
      } else {
        type = getCollectionIDType(payload.collections[relationTo].config);
      }

      return {
        ...inputObjectTypeConfig,
        [field.name]: { type: field.hasMany ? new GraphQLList(type) : type },
      };
    },
    richText: (inputObjectTypeConfig: InputObjectTypeConfig, field: RichTextField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLJSON, forceNullable) },
    }),
    row: (inputObjectTypeConfig: InputObjectTypeConfig, field: RowField) => field.fields.reduce((acc, subField: Field) => {
      const addSubField = fieldToSchemaMap[subField.type];
      if (addSubField) return addSubField(acc, subField);
      return acc;
    }, inputObjectTypeConfig),
    select: (inputObjectTypeConfig: InputObjectTypeConfig, field: SelectField) => {
      const formattedName = `${combineParentName(parentName, field.name)}_MutationInput`;
      let type: GraphQLType = new GraphQLEnumType({
        name: formattedName,
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

      type = field.hasMany ? new GraphQLList(type) : type;
      type = withNullableType(field, type, forceNullable);

      return {
        ...inputObjectTypeConfig,
        [field.name]: { type },
      };
    },
    tabs: (inputObjectTypeConfig: InputObjectTypeConfig, field: TabsField) => {
      return field.tabs.reduce((acc, tab) => {
        if (tabHasName(tab)) {
          const fullName = combineParentName(parentName, toWords(tab.name, true));
          const requiresAtLeastOneField = groupOrTabHasRequiredSubfield(field);
          let type: GraphQLType = buildMutationInputType(payload, fullName, tab.fields, fullName);
          if (requiresAtLeastOneField) type = new GraphQLNonNull(type);

          return {
            ...inputObjectTypeConfig,
            [tab.name]: { type },
          };
        }

        return {
          ...acc,
          ...tab.fields.reduce((subFieldSchema, subField) => {
            const addSubField = fieldToSchemaMap[subField.type];
            if (addSubField) return addSubField(subFieldSchema, subField);
            return subFieldSchema;
          }, acc),
        };
      }, inputObjectTypeConfig);
    },
    text: (inputObjectTypeConfig: InputObjectTypeConfig, field: TextField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    textarea: (inputObjectTypeConfig: InputObjectTypeConfig, field: TextareaField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    upload: (inputObjectTypeConfig: InputObjectTypeConfig, field: UploadField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
  };

  const fieldName = formatName(name);

  return new GraphQLInputObjectType({
    fields: fields.reduce((inputObjectTypeConfig, field) => {
      const fieldSchema = fieldToSchemaMap[field.type];

      if (typeof fieldSchema !== 'function') {
        return inputObjectTypeConfig;
      }

      return {
        ...inputObjectTypeConfig,
        ...fieldSchema(inputObjectTypeConfig, field),
      };
    }, {}),
    name: `mutation${fieldName}Input`,
  });
}

export default buildMutationInputType;
