import type {
  ArrayField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  FieldWithSubFields,
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
import { fieldAffectsData, fieldIsPresentationalOnly } from 'payload/shared'

import { GraphQLJSON } from '../packages/graphql-type-json/index.js'
import { combineParentName } from '../utilities/combineParentName.js'
import { formatName } from '../utilities/formatName.js'
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

type RecursivelyBuildNestedPathsArgs = {
  field: FieldWithSubFields | TabsField
  nestedFieldName2: string
  parentName: string
}

export const recursivelyBuildNestedPaths = ({
  field,
  nestedFieldName2,
  parentName,
}: RecursivelyBuildNestedPathsArgs) => {
  const fieldName = fieldAffectsData(field) ? field.name : undefined
  const nestedFieldName = fieldName || nestedFieldName2

  if (field.type === 'tabs') {
    // if the tab has a name, treat it as a group
    // otherwise, treat it as a row
    return field.tabs.reduce((tabSchema, tab: any) => {
      tabSchema.push(
        ...recursivelyBuildNestedPaths({
          field: {
            ...tab,
            type: 'name' in tab ? 'group' : 'row',
          },
          nestedFieldName2: nestedFieldName,
          parentName,
        }),
      )
      return tabSchema
    }, [])
  }

  const nestedPaths = field.fields.reduce((nestedFields, nestedField) => {
    if (!fieldIsPresentationalOnly(nestedField)) {
      if (!fieldAffectsData(nestedField)) {
        return [
          ...nestedFields,
          ...recursivelyBuildNestedPaths({
            field: nestedField,
            nestedFieldName2: nestedFieldName,
            parentName,
          }),
        ]
      }

      const nestedPathName = fieldAffectsData(nestedField)
        ? `${nestedFieldName ? `${nestedFieldName}__` : ''}${nestedField.name}`
        : undefined
      const getFieldSchema = fieldToSchemaMap({
        nestedFieldName,
        parentName,
      })[nestedField.type]

      if (getFieldSchema) {
        const fieldSchema = getFieldSchema({
          ...nestedField,
          name: nestedPathName,
        })

        if (Array.isArray(fieldSchema)) {
          return [...nestedFields, ...fieldSchema]
        }

        return [
          ...nestedFields,
          {
            type: fieldSchema,
            key: nestedPathName,
          },
        ]
      }
    }

    return nestedFields
  }, [])

  return nestedPaths
}
