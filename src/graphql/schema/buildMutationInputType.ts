/* eslint-disable no-use-before-define */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputFieldConfig,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import withNullableType from './withNullableType';
import formatName from '../utilities/formatName';
import combineParentName from '../utilities/combineParentName';
import { ArrayField, CodeField, JSONField, DateField, EmailField, Field, fieldAffectsData, GroupField, NumberField, PointField, RadioField, RelationshipField, RichTextField, RowField, SelectField, TextareaField, TextField, UploadField, CollapsibleField, TabsField, CheckboxField, BlockField, tabHasName } from '../../fields/config/types';
import { toWords } from '../../utilities/formatLabels';
import { Payload } from '../../payload';
import { SanitizedCollectionConfig } from '../../collections/config/types';
import { groupOrTabHasRequiredSubfield } from '../../utilities/groupOrTabHasRequiredSubfield';

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
    number: (inputObjectTypeConfig: InputObjectTypeConfig, field: NumberField) => {
      const type = field.name === 'id' ? GraphQLInt : GraphQLFloat;
      return {
        ...inputObjectTypeConfig,
        [field.name]: { type: withNullableType(field, type, forceNullable) },
      };
    },
    text: (inputObjectTypeConfig: InputObjectTypeConfig, field: TextField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    email: (inputObjectTypeConfig: InputObjectTypeConfig, field: EmailField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    textarea: (inputObjectTypeConfig: InputObjectTypeConfig, field: TextareaField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    richText: (inputObjectTypeConfig: InputObjectTypeConfig, field: RichTextField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLJSON, forceNullable) },
    }),
    code: (inputObjectTypeConfig: InputObjectTypeConfig, field: CodeField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    json: (inputObjectTypeConfig: InputObjectTypeConfig, field: JSONField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLJSON, forceNullable) },
    }),
    date: (inputObjectTypeConfig: InputObjectTypeConfig, field: DateField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    upload: (inputObjectTypeConfig: InputObjectTypeConfig, field: UploadField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    radio: (inputObjectTypeConfig: InputObjectTypeConfig, field: RadioField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    point: (inputObjectTypeConfig: InputObjectTypeConfig, field: PointField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: withNullableType(field, new GraphQLList(GraphQLFloat), forceNullable) },
    }),
    checkbox: (inputObjectTypeConfig: InputObjectTypeConfig, field: CheckboxField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: GraphQLBoolean },
    }),
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
    relationship: (inputObjectTypeConfig: InputObjectTypeConfig, field: RelationshipField) => {
      const { relationTo } = field;
      type PayloadGraphQLRelationshipType = GraphQLScalarType | GraphQLList<GraphQLScalarType> | GraphQLInputObjectType;
      let type: PayloadGraphQLRelationshipType;

      if (Array.isArray(relationTo)) {
        const fullName = `${combineParentName(parentName, toWords(field.name, true))}RelationshipInput`;
        type = new GraphQLInputObjectType({
          name: fullName,
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
        });
      } else {
        type = getCollectionIDType(payload.collections[relationTo].config);
      }

      return {
        ...inputObjectTypeConfig,
        [field.name]: { type: field.hasMany ? new GraphQLList(type) : type },
      };
    },
    array: (inputObjectTypeConfig: InputObjectTypeConfig, field: ArrayField) => {
      const fullName = combineParentName(parentName, toWords(field.name, true));
      let type: GraphQLType | GraphQLList<GraphQLType> = buildMutationInputType(payload, fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type, forceNullable));
      return {
        ...inputObjectTypeConfig,
        [field.name]: { type },
      };
    },
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
    blocks: (inputObjectTypeConfig: InputObjectTypeConfig, field: BlockField) => ({
      ...inputObjectTypeConfig,
      [field.name]: { type: GraphQLJSON },
    }),
    row: (inputObjectTypeConfig: InputObjectTypeConfig, field: RowField) => field.fields.reduce((acc, subField: Field) => {
      const addSubField = fieldToSchemaMap[subField.type];
      if (addSubField) return addSubField(acc, subField);
      return acc;
    }, inputObjectTypeConfig),
    collapsible: (inputObjectTypeConfig: InputObjectTypeConfig, field: CollapsibleField) => field.fields.reduce((acc, subField: CollapsibleField) => {
      const addSubField = fieldToSchemaMap[subField.type];
      if (addSubField) return addSubField(acc, subField);
      return acc;
    }, inputObjectTypeConfig),
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
  };

  const fieldName = formatName(name);

  return new GraphQLInputObjectType({
    name: `mutation${fieldName}Input`,
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
  });
}

export default buildMutationInputType;
