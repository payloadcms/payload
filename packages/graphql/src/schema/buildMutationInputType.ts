import type { GraphQLInputFieldConfig, GraphQLScalarType, GraphQLType } from 'graphql'
import type {
  ArrayField,
  BlocksField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  GraphQLInfo,
  GroupField,
  JSONField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RichTextField,
  RowField,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SelectField,
  TabsField,
  TextareaField,
  TextField,
  UploadField,
} from 'payload'

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql'
import { flattenTopLevelFields, toWords } from 'payload'
import { fieldAffectsData, optionIsObject, tabHasName } from 'payload/shared'

import { GraphQLJSON } from '../packages/graphql-type-json/index.js'
import { combineParentName } from '../utilities/combineParentName.js'
import { formatName } from '../utilities/formatName.js'
import { groupOrTabHasRequiredSubfield } from '../utilities/groupOrTabHasRequiredSubfield.js'
import { withNullableType } from './withNullableType.js'

const idFieldTypes = {
  number: GraphQLInt,
  text: GraphQLString,
}

export const getCollectionIDType = (
  type: keyof typeof idFieldTypes,
  collection: SanitizedCollectionConfig,
): GraphQLScalarType => {
  const idField = flattenTopLevelFields(collection.fields).find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  if (!idField) {
    return idFieldTypes[type]
  }

  return idFieldTypes[idField.type]
}

export type InputObjectTypeConfig = {
  [path: string]: GraphQLInputFieldConfig
}

type BuildMutationInputTypeArgs = {
  config: SanitizedConfig
  fields: Field[]
  forceNullable?: boolean
  graphqlResult: GraphQLInfo
  name: string
  parentIsLocalized: boolean
  parentName: string
}

export function buildMutationInputType({
  name,
  config,
  fields,
  forceNullable = false,
  graphqlResult,
  parentIsLocalized,
  parentName,
}: BuildMutationInputTypeArgs): GraphQLInputObjectType | null {
  const fieldToSchemaMap = {
    array: (inputObjectTypeConfig: InputObjectTypeConfig, field: ArrayField) => {
      const fullName = combineParentName(parentName, toWords(field.name, true))
      let type: GraphQLList<GraphQLType> | GraphQLType = buildMutationInputType({
        name: fullName,
        config,
        fields: field.fields,
        graphqlResult,
        parentIsLocalized: parentIsLocalized || field.localized,
        parentName: fullName,
      })

      if (!type) {
        return inputObjectTypeConfig
      }

      type = new GraphQLList(withNullableType({ type, field, forceNullable, parentIsLocalized }))
      return {
        ...inputObjectTypeConfig,
        [formatName(field.name)]: { type },
      }
    },
    blocks: (inputObjectTypeConfig: InputObjectTypeConfig, field: BlocksField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: { type: GraphQLJSON },
    }),
    checkbox: (inputObjectTypeConfig: InputObjectTypeConfig, field: CheckboxField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: { type: GraphQLBoolean },
    }),
    code: (inputObjectTypeConfig: InputObjectTypeConfig, field: CodeField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLString, field, forceNullable, parentIsLocalized }),
      },
    }),
    collapsible: (inputObjectTypeConfig: InputObjectTypeConfig, field: CollapsibleField) =>
      field.fields.reduce((acc, subField: CollapsibleField) => {
        const addSubField = fieldToSchemaMap[subField.type]
        if (addSubField) {
          return addSubField(acc, subField)
        }
        return acc
      }, inputObjectTypeConfig),
    date: (inputObjectTypeConfig: InputObjectTypeConfig, field: DateField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLString, field, forceNullable, parentIsLocalized }),
      },
    }),
    email: (inputObjectTypeConfig: InputObjectTypeConfig, field: EmailField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLString, field, forceNullable, parentIsLocalized }),
      },
    }),
    group: (inputObjectTypeConfig: InputObjectTypeConfig, field: GroupField) => {
      const requiresAtLeastOneField = groupOrTabHasRequiredSubfield(field)
      const fullName = combineParentName(parentName, toWords(field.name, true))
      let type: GraphQLType = buildMutationInputType({
        name: fullName,
        config,
        fields: field.fields,
        graphqlResult,
        parentIsLocalized: parentIsLocalized || field.localized,
        parentName: fullName,
      })

      if (!type) {
        return inputObjectTypeConfig
      }

      if (requiresAtLeastOneField) {
        type = new GraphQLNonNull(type)
      }
      return {
        ...inputObjectTypeConfig,
        [formatName(field.name)]: { type },
      }
    },
    json: (inputObjectTypeConfig: InputObjectTypeConfig, field: JSONField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLJSON, field, forceNullable, parentIsLocalized }),
      },
    }),
    number: (inputObjectTypeConfig: InputObjectTypeConfig, field: NumberField) => {
      const type = field.name === 'id' ? GraphQLInt : GraphQLFloat
      return {
        ...inputObjectTypeConfig,
        [formatName(field.name)]: {
          type: withNullableType({
            type: field.hasMany === true ? new GraphQLList(type) : type,
            field,
            forceNullable,
            parentIsLocalized,
          }),
        },
      }
    },
    point: (inputObjectTypeConfig: InputObjectTypeConfig, field: PointField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({
          type: new GraphQLList(GraphQLFloat),
          field,
          forceNullable,
          parentIsLocalized,
        }),
      },
    }),
    radio: (inputObjectTypeConfig: InputObjectTypeConfig, field: RadioField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLString, field, forceNullable, parentIsLocalized }),
      },
    }),
    relationship: (inputObjectTypeConfig: InputObjectTypeConfig, field: RelationshipField) => {
      const { relationTo } = field
      type PayloadGraphQLRelationshipType =
        | GraphQLInputObjectType
        | GraphQLList<GraphQLScalarType>
        | GraphQLScalarType
      let type: PayloadGraphQLRelationshipType

      if (Array.isArray(relationTo)) {
        const fullName = `${combineParentName(
          parentName,
          toWords(field.name, true),
        )}RelationshipInput`
        type = new GraphQLInputObjectType({
          name: fullName,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${fullName}RelationTo`,
                values: relationTo.reduce(
                  (values, option) => ({
                    ...values,
                    [formatName(option)]: {
                      value: option,
                    },
                  }),
                  {},
                ),
              }),
            },
            value: { type: GraphQLJSON },
          },
        })
      } else {
        type = getCollectionIDType(
          config.db.defaultIDType,
          graphqlResult.collections[relationTo].config,
        )
      }

      return {
        ...inputObjectTypeConfig,
        [formatName(field.name)]: { type: field.hasMany ? new GraphQLList(type) : type },
      }
    },
    richText: (inputObjectTypeConfig: InputObjectTypeConfig, field: RichTextField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLJSON, field, forceNullable, parentIsLocalized }),
      },
    }),
    row: (inputObjectTypeConfig: InputObjectTypeConfig, field: RowField) =>
      field.fields.reduce((acc, subField: Field) => {
        const addSubField = fieldToSchemaMap[subField.type]
        if (addSubField) {
          return addSubField(acc, subField)
        }
        return acc
      }, inputObjectTypeConfig),
    select: (inputObjectTypeConfig: InputObjectTypeConfig, field: SelectField) => {
      const formattedName = `${combineParentName(parentName, field.name)}_MutationInput`
      let type: GraphQLType = new GraphQLEnumType({
        name: formattedName,
        values: field.options.reduce((values, option) => {
          if (optionIsObject(option)) {
            return {
              ...values,
              [formatName(option.value)]: {
                value: option.value,
              },
            }
          }

          return {
            ...values,
            [formatName(option)]: {
              value: option,
            },
          }
        }, {}),
      })

      type = field.hasMany ? new GraphQLList(type) : type
      type = withNullableType({ type, field, forceNullable, parentIsLocalized })

      return {
        ...inputObjectTypeConfig,
        [formatName(field.name)]: { type },
      }
    },
    tabs: (inputObjectTypeConfig: InputObjectTypeConfig, field: TabsField) => {
      return field.tabs.reduce((acc, tab) => {
        if (tabHasName(tab)) {
          const fullName = combineParentName(parentName, toWords(tab.name, true))
          const requiresAtLeastOneField = groupOrTabHasRequiredSubfield(field)
          let type: GraphQLType = buildMutationInputType({
            name: fullName,
            config,
            fields: tab.fields,
            graphqlResult,
            parentIsLocalized: parentIsLocalized || tab.localized,
            parentName: fullName,
          })

          if (!type) {
            return acc
          }

          if (requiresAtLeastOneField) {
            type = new GraphQLNonNull(type)
          }
          return {
            ...acc,
            [tab.name]: { type },
          }
        }

        return {
          ...acc,
          ...tab.fields.reduce((subFieldSchema, subField) => {
            const addSubField = fieldToSchemaMap[subField.type]
            if (addSubField) {
              return addSubField(subFieldSchema, subField)
            }
            return subFieldSchema
          }, acc),
        }
      }, inputObjectTypeConfig)
    },
    text: (inputObjectTypeConfig: InputObjectTypeConfig, field: TextField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({
          type: field.hasMany === true ? new GraphQLList(GraphQLString) : GraphQLString,
          field,
          forceNullable,
          parentIsLocalized,
        }),
      },
    }),
    textarea: (inputObjectTypeConfig: InputObjectTypeConfig, field: TextareaField) => ({
      ...inputObjectTypeConfig,
      [formatName(field.name)]: {
        type: withNullableType({ type: GraphQLString, field, forceNullable, parentIsLocalized }),
      },
    }),
    upload: (inputObjectTypeConfig: InputObjectTypeConfig, field: UploadField) => {
      const { relationTo } = field
      type PayloadGraphQLRelationshipType =
        | GraphQLInputObjectType
        | GraphQLList<GraphQLScalarType>
        | GraphQLScalarType
      let type: PayloadGraphQLRelationshipType

      if (Array.isArray(relationTo)) {
        const fullName = `${combineParentName(
          parentName,
          toWords(field.name, true),
        )}RelationshipInput`
        type = new GraphQLInputObjectType({
          name: fullName,
          fields: {
            relationTo: {
              type: new GraphQLEnumType({
                name: `${fullName}RelationTo`,
                values: relationTo.reduce(
                  (values, option) => ({
                    ...values,
                    [formatName(option)]: {
                      value: option,
                    },
                  }),
                  {},
                ),
              }),
            },
            value: { type: GraphQLJSON },
          },
        })
      } else {
        type = getCollectionIDType(
          config.db.defaultIDType,
          graphqlResult.collections[relationTo].config,
        )
      }

      return {
        ...inputObjectTypeConfig,
        [formatName(field.name)]: { type: field.hasMany ? new GraphQLList(type) : type },
      }
    },
  }

  const fieldName = formatName(name)

  const fieldSchemas = fields.reduce((inputObjectTypeConfig, field) => {
    const fieldSchema = fieldToSchemaMap[field.type]

    if (typeof fieldSchema !== 'function') {
      return inputObjectTypeConfig
    }

    const schema = fieldSchema(inputObjectTypeConfig, field)
    if (Object.keys(schema).length === 0) {
      return inputObjectTypeConfig
    }

    return {
      ...inputObjectTypeConfig,
      ...fieldSchema(inputObjectTypeConfig, field),
    }
  }, {})

  if (Object.keys(fieldSchemas).length === 0) {
    return null
  }

  return new GraphQLInputObjectType({
    name: `mutation${fieldName}Input`,
    fields: fieldSchemas,
  })
}
