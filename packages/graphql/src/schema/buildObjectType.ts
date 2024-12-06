import type { GraphQLFieldConfig, GraphQLType } from 'graphql'
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
  JoinField,
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
  TextareaField,
  TextField,
  UploadField,
} from 'payload'

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
import { combineQueries, createDataloaderCacheKey, MissingEditorProp, toWords } from 'payload'
import { tabHasName } from 'payload/shared'

import type { Context } from '../resolvers/types.js'

import { GraphQLJSON } from '../packages/graphql-type-json/index.js'
import { combineParentName } from '../utilities/combineParentName.js'
import { formatName } from '../utilities/formatName.js'
import { formatOptions } from '../utilities/formatOptions.js'
import { isFieldNullable } from './isFieldNullable.js'
import { withNullableType } from './withNullableType.js'

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

export function buildObjectType({
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
    blocks: (objectTypeConfig: ObjectTypeConfig, field: BlocksField) => {
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
        if (addSubField) {
          return addSubField(objectTypeConfigWithCollapsibleFields, subField)
        }
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
        [field.name]: {
          type: graphqlResult.types.groupTypes[interfaceName],
          resolve: (parent, args, context: Context) => {
            return {
              ...parent[field.name],
              _id: parent._id ?? parent.id,
            }
          },
        },
      }
    },
    join: (objectTypeConfig: ObjectTypeConfig, field: JoinField) => {
      const joinName = combineParentName(parentName, toWords(field.name, true))

      const joinType = {
        type: new GraphQLObjectType({
          name: joinName,
          fields: {
            docs: {
              type: new GraphQLList(graphqlResult.collections[field.collection].graphQL.type),
            },
            hasNextPage: { type: GraphQLBoolean },
          },
        }),
        args: {
          limit: {
            type: GraphQLInt,
          },
          sort: {
            type: GraphQLString,
          },
          where: {
            type: graphqlResult.collections[field.collection].graphQL.whereInputType,
          },
        },
        extensions: { complexity: 10 },
        async resolve(parent, args, context: Context) {
          const { collection } = field
          const { limit, sort, where } = args
          const { req } = context

          const fullWhere = combineQueries(where, {
            [field.on]: { equals: parent._id ?? parent.id },
          })

          const results = await req.payload.find({
            collection,
            depth: 0,
            fallbackLocale: req.fallbackLocale,
            limit,
            locale: req.locale,
            req,
            sort,
            where: fullWhere,
          })

          return results
        },
      }

      return {
        ...objectTypeConfig,
        [field.name]: joinType,
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

      const graphQLCollections = config.collections.filter(
        (collectionConfig) => collectionConfig.graphQL !== false,
      )

      if (Array.isArray(relationTo)) {
        relationToType = new GraphQLEnumType({
          name: `${relationshipName}_RelationTo`,
          values: relationTo
            .filter((relation) =>
              graphQLCollections.some((collection) => collection.slug === relation),
            )
            .reduce(
              (relations, relation) => ({
                ...relations,
                [formatName(relation)]: {
                  value: relation,
                },
              }),
              {},
            ),
        })

        // Only pass collections that are GraphQL enabled
        const types = relationTo
          .filter((relation) =>
            graphQLCollections.some((collection) => collection.slug === relation),
          )
          .map((relation) => graphqlResult.collections[relation]?.graphQL.type)

        type = new GraphQLObjectType({
          name: `${relationshipName}_Relationship`,
          fields: {
            relationTo: {
              type: relationToType,
            },
            value: {
              type: new GraphQLUnionType({
                name: relationshipName,
                resolveType(data) {
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
        draft?: unknown
        fallbackLocale?: unknown
        limit?: unknown
        locale?: unknown
        page?: unknown
        where?: unknown
      } = {}

      const relationsUseDrafts = (Array.isArray(relationTo) ? relationTo : [relationTo])
        .filter((relation) => graphQLCollections.some((collection) => collection.slug === relation))
        .some((relation) => graphqlResult.collections[relation].config.versions?.drafts)

      if (relationsUseDrafts) {
        relationshipArgs.draft = {
          type: GraphQLBoolean,
        }
      }

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
          const draft = Boolean(args.draft ?? context.req.query?.draft)

          if (hasManyValues) {
            const results = []
            const resultPromises = []

            const createPopulationPromise = async (relatedDoc, i) => {
              let id = relatedDoc
              let collectionSlug = field.relationTo
              const isValidGraphQLCollection = isRelatedToManyCollections
                ? graphQLCollections.some((collection) => collectionSlug.includes(collection.slug))
                : graphQLCollections.some((collection) => collectionSlug === collection.slug)

              if (isValidGraphQLCollection) {
                if (isRelatedToManyCollections) {
                  collectionSlug = relatedDoc.relationTo
                  id = relatedDoc.value
                }

                const result = await context.req.payloadDataLoader.load(
                  createDataloaderCacheKey({
                    collectionSlug: collectionSlug as string,
                    currentDepth: 0,
                    depth: 0,
                    docID: id,
                    draft,
                    fallbackLocale,
                    locale,
                    overrideAccess: false,
                    showHiddenFields: false,
                    transactionID: context.req.transactionID,
                  }),
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
            }

            if (value) {
              value.forEach((relatedDoc, i) => {
                resultPromises.push(createPopulationPromise(relatedDoc, i))
              })
            }

            await Promise.all(resultPromises)
            return results.filter((result) => result !== null) // remove null entries for items that were unreadable
          }

          let id = value
          if (isRelatedToManyCollections && value) {
            id = value.value
            relatedCollectionSlug = value.relationTo
          }

          if (id) {
            if (
              graphQLCollections.some((collection) => collection.slug === relatedCollectionSlug)
            ) {
              const relatedDocument = await context.req.payloadDataLoader.load(
                createDataloaderCacheKey({
                  collectionSlug: relatedCollectionSlug as string,
                  currentDepth: 0,
                  depth: 0,
                  docID: id,
                  draft,
                  fallbackLocale,
                  locale,
                  overrideAccess: false,
                  showHiddenFields: false,
                  transactionID: context.req.transactionID,
                }),
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
          if (typeof args.depth !== 'undefined') {
            depth = args.depth
          }
          if (!field?.editor) {
            throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
          }

          if (typeof field?.editor === 'function') {
            throw new Error('Attempted to access unsanitized rich text editor.')
          }

          const editor: RichTextAdapter = field?.editor

          // RichText fields have their own depth argument in GraphQL.
          // This is why the populationPromise (which populates richtext fields like uploads and relationships)
          // is run here again, with the provided depth.
          // In the graphql find.ts resolver, the depth is then hard-coded to 0.
          // Effectively, this means that the populationPromise for GraphQL is only run here, and not in the find.ts resolver / normal population promise.
          if (editor?.graphQLPopulationPromises) {
            const fieldPromises = []
            const populationPromises = []
            const populateDepth =
              field?.maxDepth !== undefined && field?.maxDepth < depth ? field?.maxDepth : depth

            editor?.graphQLPopulationPromises({
              context,
              depth: populateDepth,
              draft: args.draft,
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
        if (addSubField) {
          return addSubField(objectTypeConfigWithRowFields, subField)
        }
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
            [tab.name]: {
              type: graphqlResult.types.groupTypes[interfaceName],
              resolve(parent, args, context: Context) {
                return {
                  ...parent[tab.name],
                  _id: parent._id ?? parent.id,
                }
              },
            },
          }
        }

        return {
          ...tabSchema,
          ...tab.fields.reduce((subFieldSchema, subField) => {
            const addSubField = fieldToSchemaMap[subField.type]
            if (addSubField) {
              return addSubField(subFieldSchema, subField)
            }
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
                resolveType(data) {
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
        draft?: unknown
        fallbackLocale?: unknown
        limit?: unknown
        locale?: unknown
        page?: unknown
        where?: unknown
      } = {}

      const relationsUseDrafts = (Array.isArray(relationTo) ? relationTo : [relationTo]).some(
        (relation) => graphqlResult.collections[relation].config.versions?.drafts,
      )

      if (relationsUseDrafts) {
        relationshipArgs.draft = {
          type: GraphQLBoolean,
        }
      }

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
          const draft = Boolean(args.draft ?? context.req.query?.draft)

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
                createDataloaderCacheKey({
                  collectionSlug,
                  currentDepth: 0,
                  depth: 0,
                  docID: id,
                  draft,
                  fallbackLocale,
                  locale,
                  overrideAccess: false,
                  showHiddenFields: false,
                  transactionID: context.req.transactionID,
                }),
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
              createDataloaderCacheKey({
                collectionSlug: relatedCollectionSlug,
                currentDepth: 0,
                depth: 0,
                docID: id,
                draft,
                fallbackLocale,
                locale,
                overrideAccess: false,
                showHiddenFields: false,
                transactionID: context.req.transactionID,
              }),
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
