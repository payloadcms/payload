/* eslint-disable no-use-before-define */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
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
import { ArrayField, Field, FieldWithSubFields, GroupField, RelationshipField, RowField, SelectField } from '../../fields/config/types';
import { toWords } from '../../utilities/formatLabels';

function buildMutationInputType(name: string, fields: Field[], parentName: string, forceNullable = false): GraphQLInputObjectType {
  const fieldToSchemaMap = {
    number: (field: Field) => ({ type: withNullableType(field, GraphQLFloat, forceNullable) }),
    text: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    email: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    textarea: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    richText: (field: Field) => ({ type: withNullableType(field, GraphQLJSON, forceNullable) }),
    code: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    date: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    upload: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    'rich-text': (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    html: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    radio: (field: Field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
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
      let type: PayloadGraphQLRelationshipType = GraphQLString;

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
            value: { type: GraphQLString },
          },
        });
      }

      return { type: field.hasMany ? new GraphQLList(type) : type };
    },
    array: (field: ArrayField) => {
      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);
      let type: GraphQLType | GraphQLList<GraphQLType> = buildMutationInputType(fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type, forceNullable));
      return { type };
    },
    group: (field: GroupField) => {
      const requiresAtLeastOneField = field.fields.some((subField) => (subField.required && !subField.localized));
      const fullName = combineParentName(parentName, field.label === false ? toWords(field.name, true) : field.label);
      let type: GraphQLType = buildMutationInputType(fullName, field.fields, fullName);
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

      return null;
    }, []),
  };

  const fieldTypes = fields.reduce((schema, field: Field) => {
    if (!field.hidden) {
      const getFieldSchema: (field: Field) => { type: GraphQLType } = fieldToSchemaMap[field.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(field);

        if (Array.isArray(fieldSchema)) {
          return fieldSchema.reduce((acc, subField, i) => ({
            ...acc,
            [(field as FieldWithSubFields).fields[i].name]: subField,
          }), schema);
        }

        return {
          ...schema,
          [field.name]: fieldSchema,
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
