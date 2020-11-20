/* eslint-disable no-use-before-define */
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { GraphQLJSON } from 'graphql-type-json';
import withNullableType from './withNullableType';
import formatName from '../utilities/formatName';
import combineParentName from '../utilities/combineParentName';

function buildMutationInputType(name, fields, parentName, forceNullable = false) {
  const fieldToSchemaMap = {
    number: (field) => ({ type: withNullableType(field, GraphQLFloat, forceNullable) }),
    text: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    email: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    textarea: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    richText: (field) => ({ type: withNullableType(field, GraphQLJSON, forceNullable) }),
    code: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    date: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    upload: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    'rich-text': (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    html: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    radio: (field) => ({ type: withNullableType(field, GraphQLString, forceNullable) }),
    checkbox: () => ({ type: GraphQLBoolean }),
    select: (field) => {
      const formattedName = `${combineParentName(parentName, field.name)}_MutationInput`;
      let type = new GraphQLEnumType({
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
    relationship: (field) => {
      const isRelatedToManyCollections = Array.isArray(field.relationTo);
      let type = GraphQLString;

      if (isRelatedToManyCollections) {
        const fullName = `${combineParentName(parentName, field.label)}RelationshipInput`;
        type = new GraphQLInputObjectType({
          name: fullName,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${fullName}RelationTo`,
                values: field.relationTo.reduce((values, option) => ({
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
    array: (field) => {
      const fullName = combineParentName(parentName, field.label);
      let type = buildMutationInputType(fullName, field.fields, fullName);
      type = new GraphQLList(withNullableType(field, type, forceNullable));
      return { type };
    },
    group: (field) => {
      const requiresAtLeastOneField = field.fields.some((subField) => (subField.required && !subField.localized));
      const fullName = combineParentName(parentName, field.label);
      let type = buildMutationInputType(fullName, field.fields, fullName);
      if (requiresAtLeastOneField) type = new GraphQLNonNull(type);
      return { type };
    },
    blocks: () => ({ type: GraphQLJSON }),
    row: (field) => field.fields.reduce((acc, rowField) => {
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

  const fieldTypes = fields.reduce((schema, field) => {
    if (!field.hidden) {
      const getFieldSchema = fieldToSchemaMap[field.type];

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema(field);

        if (Array.isArray(fieldSchema)) {
          return fieldSchema.reduce((acc, subField, i) => ({
            ...acc,
            [field.fields[i].name]: subField,
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
