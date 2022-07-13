/* eslint-disable no-use-before-define */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
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
import { ArrayField, CodeField, DateField, EmailField, Field, fieldHasSubFields, fieldAffectsData, fieldIsPresentationalOnly, GroupField, NumberField, PointField, RadioField, RelationshipField, RichTextField, RowField, SelectField, TextareaField, TextField, UploadField, CollapsibleField } from '../../fields/config/types';
import { toWords } from '../../utilities/formatLabels';
import { Payload } from '../../index';
import { SanitizedCollectionConfig } from '../../collections/config/types';

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

function buildMutationInputType(payload: Payload, name: string, fields: Field[], parentName: string, forceNullable = false): GraphQLInputObjectType {
  const fieldToSchemaMap = {
    number: (field: NumberField) => {
      const type = field.name === 'id' ? GraphQLInt : GraphQLFloat;
      return { type: withNullableType(field, type, forceNullable) };
    },
    text: (field: TextField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    email: (field: EmailField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    textarea: (field: TextareaField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    richText: (field: RichTextField) => ({ type: withNullableType(field, GraphQLJSON, forceNullable) }),
    code: (field: CodeField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    date: (field: DateField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    upload: (field: UploadField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    radio: (field: RadioField) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    point: (field: PointField) => ({ type: withNullableType(field, GraphQLList(GraphQLFloat), forceNullable) }),
    checkbox: () => ({ type: GraphQLBoolean }),
    select: (field: SelectField) => {
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

      return { type };
    },
    relationship: (field: RelationshipField) => {
      const { relationTo } = field;
      type PayloadGraphQLRelationshipType = GraphQLScalarType | GraphQLList<GraphQLScalarType> | GraphQLInputObjectType;
      let type: PayloadGraphQLRelationshipType;

      if (Array.isArray(relationTo)) {
        const fullName = `${combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label)}RelationshipInput`;
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

      return { type: field.hasMany ? new GraphQLList(type) : type };
    },
    array: (field: ArrayField) => {
      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);
      let type: GraphQLType | GraphQLList<GraphQLType> = buildMutationInputType(payload, fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type, forceNullable));
      return { type };
    },
    group: (field: GroupField) => {
      const requiresAtLeastOneField = field.fields.some((subField) => (!fieldIsPresentationalOnly(subField) && subField.required && !subField.localized));
      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);
      let type: GraphQLType = buildMutationInputType(payload, fullName, field.fields, fullName);
      if (requiresAtLeastOneField) type = new GraphQLNonNull(type);
      return { type };
    },
    blocks: () => ({ type: GraphQLJSON }),
    row: (field: RowField) => field.fields.reduce((acc, rowField: RowField) => {
      const getFieldSchema = fieldToSchemaMap[rowField.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(rowField);

        return [
          ...acc,
          fieldSchema,
        ];
      }

      return acc;
    }, []),
    collapsible: (field: CollapsibleField) => field.fields.reduce((acc, collapsibleField: CollapsibleField) => {
      const getFieldSchema = fieldToSchemaMap[collapsibleField.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(collapsibleField);

        return [
          ...acc,
          fieldSchema,
        ];
      }

      return acc;
    }, []),
  };

  const fieldTypes = fields.reduce((schema, field: Field) => {
    if (!fieldIsPresentationalOnly(field) && !field.hidden) {
      const getFieldSchema: (field: Field) => { type: GraphQLType } = fieldToSchemaMap[field.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(field);

        if (fieldHasSubFields(field) && Array.isArray(fieldSchema)) {
          return fieldSchema.reduce((acc, subField, i) => {
            const currentSubField = field.fields[i];
            if (fieldAffectsData(currentSubField)) {
              return {
                ...acc,
                [currentSubField.name]: subField,
              };
            }

            return {
              ...acc,
              ...fieldSchema,
            };
          }, schema);
        }

        if (fieldAffectsData(field)) {
          return {
            ...schema,
            [field.name]: fieldSchema,
          };
        }

        return {
          ...schema,
          ...fieldSchema,
        };
      }
    }

    return schema;
  }, {});

  const fieldName = formatName(name);

  return new GraphQLInputObjectType({
    name: `mutation${fieldName}Input`,
    fields: {
      ...fieldTypes,
    },
  });
}

export default buildMutationInputType;
