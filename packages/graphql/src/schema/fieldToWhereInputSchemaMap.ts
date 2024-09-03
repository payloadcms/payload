import type {
  ArrayField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  GroupField,
  JSONField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SelectField,
  TabsField,
  TextareaField,
  TextField,
  UploadField,
} from 'payload'

import { GraphQLEnumType, GraphQLInputObjectType } from 'graphql'

import { GraphQLJSON } from '../packages/graphql-type-json/index.js'
import { combineParentName } from '../utilities/combineParentName.js'
import { formatName } from '../utilities/formatName.js'
import { recursivelyBuildNestedPaths } from './recursivelyBuildNestedPaths.js'
import { withOperators } from './withOperators.js'

type Args = {
  nestedFieldName?: string
  parentName: string
}

export const fieldToSchemaMap = ({ nestedFieldName, parentName }: Args): any => ({
  array: (field: ArrayField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
    }),
  checkbox: (field: CheckboxField) => ({
    type: withOperators(field, parentName),
  }),
  code: (field: CodeField) => ({
    type: withOperators(field, parentName),
  }),
  collapsible: (field: CollapsibleField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
    }),
  date: (field: DateField) => ({
    type: withOperators(field, parentName),
  }),
  email: (field: EmailField) => ({
    type: withOperators(field, parentName),
  }),
  group: (field: GroupField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
    }),
  json: (field: JSONField) => ({
    type: withOperators(field, parentName),
  }),
  number: (field: NumberField) => ({
    type: withOperators(field, parentName),
  }),
  point: (field: PointField) => ({
    type: withOperators(field, parentName),
  }),
  radio: (field: RadioField) => ({
    type: withOperators(field, parentName),
  }),
  relationship: (field: RelationshipField) => {
    if (Array.isArray(field.relationTo)) {
      return {
        type: new GraphQLInputObjectType({
          name: `${combineParentName(parentName, field.name)}_Relation`,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
                values: field.relationTo.reduce(
                  (values, relation) => ({
                    ...values,
                    [formatName(relation)]: {
                      value: relation,
                    },
                  }),
                  {},
                ),
              }),
            },
            value: { type: GraphQLJSON },
          },
        }),
      }
    }

    return {
      type: withOperators(field, parentName),
    }
  },
  richText: (field: RichTextField) => ({
    type: withOperators(field, parentName),
  }),
  row: (field: RowField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
    }),
  select: (field: SelectField) => ({
    type: withOperators(field, parentName),
  }),
  tabs: (field: TabsField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
    }),
  text: (field: TextField) => ({
    type: withOperators(field, parentName),
  }),
  textarea: (field: TextareaField) => ({
    type: withOperators(field, parentName),
  }),
  upload: (field: UploadField) => {
    if (Array.isArray(field.relationTo)) {
      return {
        type: new GraphQLInputObjectType({
          name: `${combineParentName(parentName, field.name)}_Relation`,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${combineParentName(parentName, field.name)}_Relation_RelationTo`,
                values: field.relationTo.reduce(
                  (values, relation) => ({
                    ...values,
                    [formatName(relation)]: {
                      value: relation,
                    },
                  }),
                  {},
                ),
              }),
            },
            value: { type: GraphQLJSON },
          },
        }),
      }
    }

    return {
      type: withOperators(field, parentName),
    }
  },
})
