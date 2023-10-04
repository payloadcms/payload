import { GraphQLEnumType, GraphQLInputObjectType, GraphQLString } from 'graphql'
import GraphQLJSON from 'graphql-type-json'

import type { Payload } from '../..'
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
  TextField,
  TextareaField,
  UploadField,
} from '../../fields/config/types'

import combineParentName from '../utilities/combineParentName'
import formatName from '../utilities/formatName'
import recursivelyBuildNestedPaths from './recursivelyBuildNestedPaths'
import { withOperators } from './withOperators'

type Args = {
  nestedFieldName?: string
  parentName: string
  payload: Payload
}

const fieldToSchemaMap = ({ nestedFieldName, parentName, payload }: Args): any => ({
  array: (field: ArrayField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
      payload,
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
      payload,
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
      payload,
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
      payload,
    }),
  select: (field: SelectField) => ({
    type: withOperators(field, parentName),
  }),
  tabs: (field: TabsField) =>
    recursivelyBuildNestedPaths({
      field,
      nestedFieldName2: nestedFieldName,
      parentName,
      payload,
    }),
  text: (field: TextField) => ({
    type: withOperators(field, parentName),
  }),
  textarea: (field: TextareaField) => ({
    type: withOperators(field, parentName),
  }),
  upload: (field: UploadField) => ({
    type: withOperators(field, parentName),
  }),
})

export default fieldToSchemaMap
