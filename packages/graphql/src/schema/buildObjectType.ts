/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import type { GraphQLFieldConfig, GraphQLType } from 'graphql'
import type { GraphQLInfo } from 'payload/config'
import type {
  ArrayField,
  BlockField,
  CheckboxField,
  CodeField,
  CollapsibleField,
  DateField,
  EmailField,
  Field,
  GroupField,
  JSONField,
  NumberField,
  PointField,
  RadioField,
  RelationshipField,
  RichTextAdapter,
  RichTextField,
  RowField,
  SanitizedConfig,
  SelectField,
  TabsField,
  TextField,
  TextareaField,
  UploadField,
} from 'payload/types'

import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from 'graphql'
import { DateTimeResolver, EmailAddressResolver } from 'graphql-scalars'
/* eslint-disable no-use-before-define */
import { GraphQLJSON } from 'graphql-type-json'
import { tabHasName } from 'payload/types'
import { toWords } from 'payload/utilities'

import type { Context } from '../resolvers/types.js'

import combineParentName from '../utilities/combineParentName.js'
import formatName from '../utilities/formatName.js'
import formatOptions from '../utilities/formatOptions.js'
import buildWhereInputType from './buildWhereInputType.js'
import isFieldNullable from './isFieldNullable.js'
import withNullableType from './withNullableType.js'

type LocaleInputType = {
  fallbackLocale: {
    type: GraphQLType
  }
  locale: {
    type: GraphQLType
  }
  where: {
    type: GraphQLType
  }
}

export type ObjectTypeConfig = {
  [path: string]: GraphQLFieldConfig<any, any>
}

type Args = {
  baseFields?: ObjectTypeConfig
  config: SanitizedConfig
  fields: Field[]
  forceNullable?: boolean
  graphqlResult: GraphQLInfo
  name: string
  parentName: string
}

function buildObjectType({
  name,
  baseFields = {},
  config,
  fields,
  forceNullable,
  graphqlResult,
  parentName,
}: Args): GraphQLObjectType {
  const fieldToSchemaMap = {
    array: (objectTypeConfig: ObjectTypeConfig, field: ArrayField) => {
      const interfaceName =
        field?.interfaceName || combineParentName(parentName, toWords(field.name, true))

      if (!graphqlResult.types.arrayTypes[interfaceName]) {
        const objectType = buildObjectType({
          name: interfaceName,
          config,
          fields: field.fields,
          forceNullable: isFieldNullable(field, forceNullable),
          graphqlResult,
          parentName: interfaceName,
        })

        if (Object.keys(objectType.getFields()).length) {
          graphqlResult.types.arrayTypes[interfaceName] = objectType
        }
      }

      if (!graphqlResult.types.arrayTypes[interfaceName]) {
        return objectTypeConfig
      }

      const arrayType = new GraphQLList(
        new GraphQLNonNull(graphqlResult.types.arrayTypes[interfaceName]),
      )

      return {
        ...objectTypeConfig,
        [field.name]: { type: withNullableType(field, arrayType) },
      }
    },
    blocks: (objectTypeConfig: ObjectTypeConfig, field: BlockField) => {
      const blockTypes: GraphQLObjectType<any, any>[] = field.blocks.reduce((acc, block) => {
        if (!graphqlResult.types.blockTypes[block.slug]) {
          const interfaceName =
            block?.interfaceName || block?.graphQL?.singularName || toWords(block.slug, true)

          const objectType = buildObjectType({
            name: interfaceName,
            config,
            fields: [
              ...block.fields,
              {
                name: 'blockType',
                type: 'text',
              },
            ],
            forceNullable,
            graphqlResult,
            parentName: interfaceName,
          })

          if (Object.keys(objectType.getFields()).length) {
            graphqlResult.types.blockTypes[block.slug] = objectType
          }
        }

        if (graphqlResult.types.blockTypes[block.slug]) {
          acc.push(graphqlResult.types.blockTypes[block.slug])
        }

        return acc
      }, [])

      if (blockTypes.length === 0) {
        return objectTypeConfig
      }

      const fullName = combineParentName(parentName, toWords(field.name, true))

      const type = new GraphQLList(
        new GraphQLNonNull(
          new GraphQLUnionType({
            name: fullName,
            resolveType: (data) => graphqlResult.types.blockTypes[data.blockType].name,
            types: blockTypes,
          }),
        ),
      )

      return {
        ...objectTypeConfig,
        [field.name]: { type: withNullableType(field, type) },
      }
    },
    checkbox: (objectTypeConfig: ObjectTypeConfig, field: CheckboxField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLBoolean, forceNullable) },
    }),
    code: (objectTypeConfig: ObjectTypeConfig, field: CodeField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    collapsible: (objectTypeConfig: ObjectTypeConfig, field: CollapsibleField) =>
      field.fields.reduce((objectTypeConfigWithCollapsibleFields, subField) => {
        const addSubField = fieldToSchemaMap[subField.type]
        if (addSubField) return addSubField(objectTypeConfigWithCollapsibleFields, subField)
        return objectTypeConfigWithCollapsibleFields
      }, objectTypeConfig),
    date: (objectTypeConfig: ObjectTypeConfig, field: DateField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, DateTimeResolver, forceNullable) },
    }),
    email: (objectTypeConfig: ObjectTypeConfig, field: EmailField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, EmailAddressResolver, forceNullable) },
    }),
    group: (objectTypeConfig: ObjectTypeConfig, field: GroupField) => {
      const interfaceName =
        field?.interfaceName || combineParentName(parentName, toWords(field.name, true))

      if (!graphqlResult.types.groupTypes[interfaceName]) {
        const objectType = buildObjectType({
          name: interfaceName,
          config,
          fields: field.fields,
          forceNullable: isFieldNullable(field, forceNullable),
          graphqlResult,
          parentName: interfaceName,
        })

        if (Object.keys(objectType.getFields()).length) {
          graphqlResult.types.groupTypes[interfaceName] = objectType
        }
      }

      if (!graphqlResult.types.groupTypes[interfaceName]) {
        return objectTypeConfig
      }

      return {
        ...objectTypeConfig,
        [field.name]: { type: graphqlResult.types.groupTypes[interfaceName] },
      }
    },
    json: (objectTypeConfig: ObjectTypeConfig, field: JSONField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLJSON, forceNullable) },
    }),
    number: (objectTypeConfig: ObjectTypeConfig, field: NumberField) => {
      const type = field?.name === 'id' ? GraphQLInt : GraphQLFloat
      return {
        ...objectTypeConfig,
        [field.name]: {
          type: withNullableType(
            field,
            field?.hasMany === true ? new GraphQLList(type) : type,
            forceNullable,
          ),
        },
      }
    },
    point: (objectTypeConfig: ObjectTypeConfig, field: PointField) => ({
      ...objectTypeConfig,
      [field.name]: {
        type: withNullableType(
          field,
          new GraphQLList(new GraphQLNonNull(GraphQLFloat)),
          forceNullable,
        ),
      },
    }),
    radio: (objectTypeConfig: ObjectTypeConfig, field: RadioField) => ({
      ...objectTypeConfig,
      [field.name]: {
        type: withNullableType(
          field,
          new GraphQLEnumType({
            name: combineParentName(parentName, field.name),
            values: formatOptions(field),
          }),
          forceNullable,
        ),
      },
    }),
    relationship: (objectTypeConfig: ObjectTypeConfig, field: RelationshipField) => {
      const { relationTo } = field
      const isRelatedToManyCollections = Array.isArray(relationTo)
      const hasManyValues = field.hasMany
      const relationshipName = combineParentName(parentName, toWords(field.name, true))

      let type
      let relationToType = null

      if (Array.isArray(relationTo)) {
        relationToType = new GraphQLEnumType({
          name: `${relationshipName}_RelationTo`,
          values: relationTo.reduce(
            (relations, relation) => ({
              ...relations,
              [formatName(relation)]: {
                value: relation,
              },
            }),
            {},
          ),
        })

        const types = relationTo.map((relation) => graphqlResult.collections[relation].graphQL.type)

        type = new GraphQLObjectType({
          name: `${relationshipName}_Relationship`,
          fields: {
            relationTo: {
              type: relationToType,
            },
            value: {
              type: new GraphQLUnionType({
                name: relationshipName,
                async resolveType(data, { req }) {
                  return graphqlResult.collections[data.collection].graphQL.type.name
                },
                types,
              }),
            },
          },
        })
      } else {
        ;({ type } = graphqlResult.collections[relationTo].graphQL)
      }

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      type = type || newlyCreatedBlockType

      const relationshipArgs: {
        fallbackLocale?: unknown
        limit?: unknown
        locale?: unknown
        page?: unknown
        where?: unknown
      } = {}

      if (config.localization) {
        relationshipArgs.locale = {
          type: graphqlResult.types.localeInputType,
        }

        relationshipArgs.fallbackLocale = {
          type: graphqlResult.types.fallbackLocaleInputType,
        }
      }

      const relationship = {
        type: withNullableType(
          field,
          hasManyValues ? new GraphQLList(new GraphQLNonNull(type)) : type,
          forceNullable,
        ),
        args: relationshipArgs,
        extensions: { complexity: 10 },
        async resolve(parent, args, context: Context) {
          const value = parent[field.name]
          const locale = args.locale || context.req.locale
          const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale
          let relatedCollectionSlug = field.relationTo

          if (hasManyValues) {
            const results = []
            const resultPromises = []

            const createPopulationPromise = async (relatedDoc, i) => {
              let id = relatedDoc
              let collectionSlug = field.relationTo

              if (isRelatedToManyCollections) {
                collectionSlug = relatedDoc.relationTo
                id = relatedDoc.value
              }

              const result = await context.req.payloadDataLoader.load(
                JSON.stringify([
                  context.req.transactionID,
                  collectionSlug,
                  id,
                  0,
                  0,
                  locale,
                  fallbackLocale,
                  false,
                  false,
                ]),
              )

              if (result) {
                if (isRelatedToManyCollections) {
                  results[i] = {
                    relationTo: collectionSlug,
                    value: {
                      ...result,
                      collection: collectionSlug,
                    },
                  }
                } else {
                  results[i] = result
                }
              }
            }

            if (value) {
              value.forEach((relatedDoc, i) => {
                resultPromises.push(createPopulationPromise(relatedDoc, i))
              })
            }

            await Promise.all(resultPromises)
            return results
          }

          let id = value
          if (isRelatedToManyCollections && value) {
            id = value.value
            relatedCollectionSlug = value.relationTo
          }

          if (id) {
            const relatedDocument = await context.req.payloadDataLoader.load(
              JSON.stringify([
                context.req.transactionID,
                relatedCollectionSlug,
                id,
                0,
                0,
                locale,
                fallbackLocale,
                false,
                false,
              ]),
            )

            if (relatedDocument) {
              if (isRelatedToManyCollections) {
                return {
                  relationTo: relatedCollectionSlug,
                  value: {
                    ...relatedDocument,
                    collection: relatedCollectionSlug,
                  },
                }
              }

              return relatedDocument
            }

            return null
          }

          return null
        },
      }

      return {
        ...objectTypeConfig,
        [field.name]: relationship,
      }
    },
    richText: (objectTypeConfig: ObjectTypeConfig, field: RichTextField) => ({
      ...objectTypeConfig,
      [field.name]: {
        type: withNullableType(field, GraphQLJSON, forceNullable),
        args: {
          depth: {
            type: GraphQLInt,
          },
        },
        async resolve(parent, args, context: Context) {
          let depth = config.defaultDepth
          if (typeof args.depth !== 'undefined') depth = args.depth
          const editor: RichTextAdapter = field?.editor

          // RichText fields have their own depth argument in GraphQL.
          // This is why the populationPromise (which populates richtext fields like uploads and relationships)
          // is run here again, with the provided depth.
          // In the graphql find.ts resolver, the depth is then hard-coded to 0.
          // Effectively, this means that the populationPromise for GraphQL is only run here, and not in the find.ts resolver / normal population promise.
          if (editor?.populationPromises) {
            const fieldPromises = []
            const populationPromises = []
            editor?.populationPromises({
              context,
              depth,
              field,
              fieldPromises,
              findMany: false,
              flattenLocales: false,
              overrideAccess: false,
              populationPromises,
              req: context.req,
              showHiddenFields: false,
              siblingDoc: parent,
            })
            await Promise.all(fieldPromises)
            await Promise.all(populationPromises)
          }

          return parent[field.name]
        },
      },
    }),
    row: (objectTypeConfig: ObjectTypeConfig, field: RowField) =>
      field.fields.reduce((objectTypeConfigWithRowFields, subField) => {
        const addSubField = fieldToSchemaMap[subField.type]
        if (addSubField) return addSubField(objectTypeConfigWithRowFields, subField)
        return objectTypeConfigWithRowFields
      }, objectTypeConfig),
    select: (objectTypeConfig: ObjectTypeConfig, field: SelectField) => {
      const fullName = combineParentName(parentName, field.name)

      let type: GraphQLType = new GraphQLEnumType({
        name: fullName,
        values: formatOptions(field),
      })

      type = field.hasMany ? new GraphQLList(new GraphQLNonNull(type)) : type
      type = withNullableType(field, type, forceNullable)

      return {
        ...objectTypeConfig,
        [field.name]: { type },
      }
    },
    tabs: (objectTypeConfig: ObjectTypeConfig, field: TabsField) =>
      field.tabs.reduce((tabSchema, tab) => {
        if (tabHasName(tab)) {
          const interfaceName =
            tab?.interfaceName || combineParentName(parentName, toWords(tab.name, true))

          if (!graphqlResult.types.groupTypes[interfaceName]) {
            const objectType = buildObjectType({
              name: interfaceName,
              config,
              fields: tab.fields,
              forceNullable,
              graphqlResult,
              parentName: interfaceName,
            })

            if (Object.keys(objectType.getFields()).length) {
              graphqlResult.types.groupTypes[interfaceName] = objectType
            }
          }

          if (!graphqlResult.types.groupTypes[interfaceName]) {
            return tabSchema
          }

          return {
            ...tabSchema,
            [tab.name]: { type: graphqlResult.types.groupTypes[interfaceName] },
          }
        }

        return {
          ...tabSchema,
          ...tab.fields.reduce((subFieldSchema, subField) => {
            const addSubField = fieldToSchemaMap[subField.type]
            if (addSubField) return addSubField(subFieldSchema, subField)
            return subFieldSchema
          }, tabSchema),
        }
      }, objectTypeConfig),
    text: (objectTypeConfig: ObjectTypeConfig, field: TextField) => ({
      ...objectTypeConfig,
      [field.name]: {
        type: withNullableType(
          field,
          field.hasMany === true ? new GraphQLList(GraphQLString) : GraphQLString,
          forceNullable,
        ),
      },
    }),
    textarea: (objectTypeConfig: ObjectTypeConfig, field: TextareaField) => ({
      ...objectTypeConfig,
      [field.name]: { type: withNullableType(field, GraphQLString, forceNullable) },
    }),
    upload: (objectTypeConfig: ObjectTypeConfig, field: UploadField) => {
      const { relationTo } = field

      const uploadName = combineParentName(parentName, toWords(field.name, true))

      // If the relationshipType is undefined at this point,
      // it can be assumed that this blockType can have a relationship
      // to itself. Therefore, we set the relationshipType equal to the blockType
      // that is currently being created.

      const type = withNullableType(
        field,
        graphqlResult.collections[relationTo].graphQL.type || newlyCreatedBlockType,
        forceNullable,
      )

      const uploadArgs = {} as LocaleInputType

      if (config.localization) {
        uploadArgs.locale = {
          type: graphqlResult.types.localeInputType,
        }

        uploadArgs.fallbackLocale = {
          type: graphqlResult.types.fallbackLocaleInputType,
        }
      }

      const relatedCollectionSlug = field.relationTo

      const upload = {
        type,
        args: uploadArgs,
        extensions: { complexity: 20 },
        async resolve(parent, args, context: Context) {
          const value = parent[field.name]
          const locale = args.locale || context.req.locale
          const fallbackLocale = args.fallbackLocale || context.req.fallbackLocale
          const id = value

          if (id) {
            const relatedDocument = await context.req.payloadDataLoader.load(
              JSON.stringify([
                context.req.transactionID,
                relatedCollectionSlug,
                id,
                0,
                0,
                locale,
                fallbackLocale,
                false,
                false,
              ]),
            )

            return relatedDocument || null
          }

          return null
        },
      }

      const whereFields = graphqlResult.collections[relationTo].config.fields

      upload.args.where = {
        type: buildWhereInputType({
          name: uploadName,
          fields: whereFields,
          parentName: uploadName,
        }),
      }

      return {
        ...objectTypeConfig,
        [field.name]: upload,
      }
    },
  }

  const objectSchema = {
    name,
    fields: () =>
      fields.reduce((objectTypeConfig, field) => {
        const fieldSchema = fieldToSchemaMap[field.type]

        if (typeof fieldSchema !== 'function') {
          return objectTypeConfig
        }

        return {
          ...objectTypeConfig,
          ...fieldSchema(objectTypeConfig, field),
        }
      }, baseFields),
  }

  const newlyCreatedBlockType = new GraphQLObjectType(objectSchema)

  return newlyCreatedBlockType
}

export default buildObjectType
