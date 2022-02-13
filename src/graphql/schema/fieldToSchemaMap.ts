import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLString,
} from 'graphql';
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars';
import { GraphQLJSON } from 'graphql-type-json';
import {
  ArrayField,
  CheckboxField,
  CodeField, DateField,
  EmailField, fieldAffectsData, fieldHasSubFields, GroupField,
  NumberField, optionIsObject, PointField,
  RadioField, RelationshipField,
  RichTextField, RowField, SelectField,
  TextareaField,
  TextField, UploadField,
} from '../../fields/config/types';
import withOperators from './withOperators';
import operators from './operators';
import combineParentName from '../utilities/combineParentName';
import formatName from '../utilities/formatName';
import recursivelyBuildNestedPaths from './recursivelyBuildNestedPaths';

const fieldToSchemaMap: (parentName: string) => any = (parentName: string) => ({
  number: (field: NumberField) => {
    const type = GraphQLFloat;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, ...operators.comparison],
      ),
    };
  },
  text: (field: TextField) => {
    const type = GraphQLString;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, 'like'],
      ),
    };
  },
  email: (field: EmailField) => {
    const type = EmailAddressResolver;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, 'like'],
      ),
    };
  },
  textarea: (field: TextareaField) => {
    const type = GraphQLString;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, 'like'],
      ),
    };
  },
  richText: (field: RichTextField) => {
    const type = GraphQLJSON;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, 'like'],
      ),
    };
  },
  code: (field: CodeField) => {
    const type = GraphQLString;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, 'like'],
      ),
    };
  },
  radio: (field: RadioField) => ({
    type: withOperators(
      field,
      new GraphQLEnumType({
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
      parentName,
      [...operators.equality, 'like'],
    ),
  }),
  date: (field: DateField) => {
    const type = DateTimeResolver;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, ...operators.comparison, 'like'],
      ),
    };
  },
  point: (field: PointField) => {
    const type = GraphQLList(GraphQLFloat);
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, ...operators.comparison, ...operators.geo],
      ),
    };
  },
  relationship: (field: RelationshipField) => {
    let type = withOperators(
      field,
      GraphQLString,
      parentName,
      [...operators.equality, ...operators.contains],
    );

    if (Array.isArray(field.relationTo)) {
      type = new GraphQLInputObjectType({
        name: `${combineParentName(parentName, field.name)}_Relation`,
        fields: {
          relationTo: {
            type: new GraphQLEnumType({
              name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
              values: field.relationTo.reduce((values, relation) => ({
                ...values,
                [formatName(relation)]: {
                  value: relation,
                },
              }), {}),
            }),
          },
          value: { type: GraphQLString },
        },
      });
    }

    if (field.hasMany) {
      return {
        type: new GraphQLList(type),
      };
    }

    return { type };
  },
  upload: (field: UploadField) => ({
    type: withOperators(
      field,
      GraphQLString,
      parentName,
      [...operators.equality],
    ),
  }),
  checkbox: (field: CheckboxField) => ({
    type: withOperators(
      field,
      GraphQLBoolean,
      parentName,
      [...operators.equality],
    ),
  }),
  select: (field: SelectField) => ({
    type: withOperators(
      field,
      new GraphQLEnumType({
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
      parentName,
      [...operators.equality, ...operators.contains],
    ),
  }),
  array: (field: ArrayField) => recursivelyBuildNestedPaths(parentName, field),
  group: (field: GroupField) => recursivelyBuildNestedPaths(parentName, field),
  row: (field: RowField) => field.fields.reduce((rowSchema, rowField) => {
    const getFieldSchema = fieldToSchemaMap(parentName)[rowField.type];

    if (getFieldSchema) {
      const rowFieldSchema = getFieldSchema(rowField);

      if (fieldHasSubFields(rowField)) {
        return [
          ...rowSchema,
          ...rowFieldSchema,
        ];
      }

      if (fieldAffectsData(rowField)) {
        return [
          ...rowSchema,
          {
            key: rowField.name,
            type: rowFieldSchema,
          },
        ];
      }
    }


    return rowSchema;
  }, []),
});

export default fieldToSchemaMap;
