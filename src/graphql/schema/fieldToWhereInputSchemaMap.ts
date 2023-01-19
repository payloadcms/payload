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
  CodeField, CollapsibleField, DateField,
  EmailField, fieldAffectsData, fieldHasSubFields, GroupField,
  JSONField,
  NumberField, optionIsObject, PointField,
  RadioField, RelationshipField,
  RichTextField, RowField, SelectField,
  TabsField,
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
        [...operators.equality, ...operators.partial, ...operators.contains],
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
        [...operators.equality, ...operators.partial, ...operators.contains],
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
        [...operators.equality, ...operators.partial],
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
        [...operators.equality, ...operators.partial],
      ),
    };
  },
  json: (field: JSONField) => {
    const type = GraphQLJSON;
    return {
      type: withOperators(
        field,
        type,
        parentName,
        [...operators.equality, ...operators.partial],
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
        [...operators.equality, ...operators.partial],
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
      [...operators.equality, ...operators.contains],
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
    const type = new GraphQLList(GraphQLFloat);
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
  row: (field: RowField) => field.fields.reduce((rowSchema, subField) => {
    const getFieldSchema = fieldToSchemaMap(parentName)[subField.type];

    if (getFieldSchema) {
      const rowFieldSchema = getFieldSchema(subField);

      if (fieldHasSubFields(subField)) {
        return [
          ...rowSchema,
          ...rowFieldSchema,
        ];
      }

      if (fieldAffectsData(subField)) {
        return [
          ...rowSchema,
          {
            key: subField.name,
            type: rowFieldSchema,
          },
        ];
      }
    }


    return rowSchema;
  }, []),
  collapsible: (field: CollapsibleField) => field.fields.reduce((rowSchema, subField) => {
    const getFieldSchema = fieldToSchemaMap(parentName)[subField.type];

    if (getFieldSchema) {
      const rowFieldSchema = getFieldSchema(subField);

      if (fieldHasSubFields(subField)) {
        return [
          ...rowSchema,
          ...rowFieldSchema,
        ];
      }

      if (fieldAffectsData(subField)) {
        return [
          ...rowSchema,
          {
            key: subField.name,
            type: rowFieldSchema,
          },
        ];
      }
    }


    return rowSchema;
  }, []),
  tabs: (field: TabsField) => field.tabs.reduce((tabSchema, tab) => {
    return [
      ...tabSchema,
      ...tab.fields.reduce((rowSchema, subField) => {
        const getFieldSchema = fieldToSchemaMap(parentName)[subField.type];

        if (getFieldSchema) {
          const rowFieldSchema = getFieldSchema(subField);

          if (fieldHasSubFields(subField)) {
            return [
              ...rowSchema,
              ...rowFieldSchema,
            ];
          }

          if (fieldAffectsData(subField)) {
            return [
              ...rowSchema,
              {
                key: subField.name,
                type: rowFieldSchema,
              },
            ];
          }
        }


        return rowSchema;
      }, []),
    ];
  }, []),
});

export default fieldToSchemaMap;
