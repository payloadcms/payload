import type { GraphQLArgumentConfig, GraphQLFieldConfig, GraphQLOutputType } from 'graphql'
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
import { buildObjectType, type ObjectTypeConfig } from './buildObjectType.js'
import { isFieldNullable } from './isFieldNullable.js'
import { withNullableType } from './withNullableType.js'

function formattedNameResolver({
  field,
  ...rest
}: { field: Field } & GraphQLFieldConfig<any, any, any>): GraphQLFieldConfig<any, any, any> {
  if ('name' in field) {
    if (formatName(field.name) !== field.name) {
      return {
        ...rest,
        resolve: (parent) => parent[field.name],
      }
    }
  }
  return rest
}

type SharedArgs = {
  config: SanitizedConfig
  forceNullable?: boolean
  graphqlResult: GraphQLInfo
  newlyCreatedBlockType: GraphQLObjectType
  objectTypeConfig: ObjectTypeConfig
  parentIsLocalized?: boolean
  parentName: string
}

type GenericFieldToSchemaMap = (args: { field: Field } & SharedArgs) => ObjectTypeConfig

type FieldToSchemaMap = {
  array: (args: { field: ArrayField } & SharedArgs) => ObjectTypeConfig
  blocks: (args: { field: BlocksField } & SharedArgs) => ObjectTypeConfig
  checkbox: (args: { field: CheckboxField } & SharedArgs) => ObjectTypeConfig
  code: (args: { field: CodeField } & SharedArgs) => ObjectTypeConfig
  collapsible: (args: { field: CollapsibleField } & SharedArgs) => ObjectTypeConfig
  date: (args: { field: DateField } & SharedArgs) => ObjectTypeConfig
  email: (args: { field: EmailField } & SharedArgs) => ObjectTypeConfig
  group: (args: { field: GroupField } & SharedArgs) => ObjectTypeConfig
  join: (args: { field: JoinField } & SharedArgs) => ObjectTypeConfig
  json: (args: { field: JSONField } & SharedArgs) => ObjectTypeConfig
  number: (args: { field: NumberField } & SharedArgs) => ObjectTypeConfig
  point: (args: { field: PointField } & SharedArgs) => ObjectTypeConfig
  radio: (args: { field: RadioField } & SharedArgs) => ObjectTypeConfig
  relationship: (args: { field: RelationshipField } & SharedArgs) => ObjectTypeConfig
  richText: (args: { field: RichTextField } & SharedArgs) => ObjectTypeConfig
  row: (args: { field: RowField } & SharedArgs) => ObjectTypeConfig
  select: (args: { field: SelectField } & SharedArgs) => ObjectTypeConfig
  tabs: (args: { field: TabsField } & SharedArgs) => ObjectTypeConfig
  text: (args: { field: TextField } & SharedArgs) => ObjectTypeConfig
  textarea: (args: { field: TextareaField } & SharedArgs) => ObjectTypeConfig
  upload: (args: { field: UploadField } & SharedArgs) => ObjectTypeConfig
}

export const fieldToSchemaMap: FieldToSchemaMap = {
  array: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) => {
    const interfaceName =
      field?.interfaceName || combineParentName(parentName, toWords(field.name, true))

    if (!graphqlResult.types.arrayTypes[interfaceName]) {
      const objectType = buildObjectType({
        name: interfaceName,
        config,
        fields: field.fields,
        forceNullable: isFieldNullable({ field, forceNullable, parentIsLocalized }),
        graphqlResult,
        parentIsLocalized: field.localized || parentIsLocalized,
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
      [formatName(field.name)]: formattedNameResolver({
        type: withNullableType({ type: arrayType, field, parentIsLocalized }) as GraphQLOutputType,
        field,
      }),
    }
  },
  blocks: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) => {
    const blockTypes: GraphQLObjectType<any, any>[] = (
      field.blockReferences ?? field.blocks
    ).reduce((acc, _block) => {
      const blockSlug = typeof _block === 'string' ? _block : _block.slug
      if (!graphqlResult.types.blockTypes[blockSlug]) {
        // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
        const block =
          typeof _block === 'string' ? config.blocks.find((b) => b.slug === _block) : _block

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
          parentIsLocalized,
          parentName: interfaceName,
        })

        if (Object.keys(objectType.getFields()).length) {
          graphqlResult.types.blockTypes[block.slug] = objectType
        }
      }

      if (graphqlResult.types.blockTypes[blockSlug]) {
        acc.push(graphqlResult.types.blockTypes[blockSlug])
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
    ) as GraphQLOutputType

    return {
      ...objectTypeConfig,
      [formatName(field.name)]: formattedNameResolver({
        type: withNullableType({ type, field, parentIsLocalized }) as GraphQLOutputType,
        field,
      }),
    }
  },
  checkbox: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: GraphQLBoolean,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  code: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: GraphQLString,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  collapsible: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    newlyCreatedBlockType,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) =>
    field.fields.reduce((objectTypeConfigWithCollapsibleFields, subField) => {
      const addSubField: GenericFieldToSchemaMap = fieldToSchemaMap[subField.type]
      if (addSubField) {
        return addSubField({
          config,
          field: subField,
          forceNullable,
          graphqlResult,
          newlyCreatedBlockType,
          objectTypeConfig: objectTypeConfigWithCollapsibleFields,
          parentIsLocalized,
          parentName,
        })
      }
      return objectTypeConfigWithCollapsibleFields
    }, objectTypeConfig),
  date: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: DateTimeResolver,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  email: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: EmailAddressResolver,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  group: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) => {
    const interfaceName =
      field?.interfaceName || combineParentName(parentName, toWords(field.name, true))

    if (!graphqlResult.types.groupTypes[interfaceName]) {
      const objectType = buildObjectType({
        name: interfaceName,
        config,
        fields: field.fields,
        forceNullable: isFieldNullable({ field, forceNullable, parentIsLocalized }),
        graphqlResult,
        parentIsLocalized: field.localized || parentIsLocalized,
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
      [formatName(field.name)]: {
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
  join: ({ field, graphqlResult, objectTypeConfig, parentName }) => {
    const joinName = combineParentName(parentName, toWords(field.name, true))

    const joinType = {
      type: new GraphQLObjectType({
        name: joinName,
        fields: {
          docs: {
            type: new GraphQLNonNull(
              Array.isArray(field.collection)
                ? GraphQLJSON
                : new GraphQLList(
                    new GraphQLNonNull(graphqlResult.collections[field.collection].graphQL.type),
                  ),
            ),
          },
          hasNextPage: { type: new GraphQLNonNull(GraphQLBoolean) },
        },
      }),
      args: {
        limit: {
          type: GraphQLInt,
        },
        page: {
          type: GraphQLInt,
        },
        sort: {
          type: GraphQLString,
        },
        where: {
          type: Array.isArray(field.collection)
            ? GraphQLJSON
            : graphqlResult.collections[field.collection].graphQL.whereInputType,
        },
      },
      extensions: {
        complexity: typeof field?.graphQL?.complexity === 'number' ? field.graphQL.complexity : 10,
      },
      async resolve(parent, args, context: Context) {
        const { collection } = field
        const { limit, page, sort, where } = args
        const { req } = context

        const draft = Boolean(args.draft ?? context.req.query?.draft)

        const fullWhere = combineQueries(where, {
          [field.on]: { equals: parent._id ?? parent.id },
        })

        if (Array.isArray(collection)) {
          throw new Error('GraphQL with array of join.field.collection is not implemented')
        }

        return await req.payload.find({
          collection,
          depth: 0,
          draft,
          fallbackLocale: req.fallbackLocale,
          limit,
          locale: req.locale,
          overrideAccess: false,
          page,
          req,
          sort,
          where: fullWhere,
        })
      },
    }

    return {
      ...objectTypeConfig,
      [formatName(field.name)]: joinType,
    }
  },
  json: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: GraphQLJSON,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  number: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => {
    const type = field?.name === 'id' ? GraphQLInt : GraphQLFloat
    return {
      ...objectTypeConfig,
      [formatName(field.name)]: formattedNameResolver({
        type: withNullableType({
          type: field?.hasMany === true ? new GraphQLList(new GraphQLNonNull(type)) : type,
          field,
          forceNullable,
          parentIsLocalized,
        }) as GraphQLOutputType,
        field,
      }),
    }
  },
  point: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)),
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  radio: ({ field, forceNullable, objectTypeConfig, parentIsLocalized, parentName }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: new GraphQLEnumType({
          name: combineParentName(parentName, field.name),
          values: formatOptions(field),
        }),
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  relationship: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    newlyCreatedBlockType,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) => {
    const { relationTo } = field
    const isRelatedToManyCollections = Array.isArray(relationTo)
    const hasManyValues = field.hasMany
    const relationshipName = combineParentName(parentName, toWords(field.name, true))

    let type: GraphQLOutputType
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
        .filter((relation) => graphQLCollections.some((collection) => collection.slug === relation))
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
            }) as GraphQLOutputType,
          },
        },
      }) as GraphQLOutputType
    } else {
      ;({ type } = graphqlResult.collections[relationTo].graphQL)
    }

    // If the relationshipType is undefined at this point,
    // it can be assumed that this blockType can have a relationship
    // to itself. Therefore, we set the relationshipType equal to the blockType
    // that is currently being created.

    type = type || newlyCreatedBlockType

    const relationshipArgs: {
      draft: GraphQLArgumentConfig
      fallbackLocale: GraphQLArgumentConfig
      limit: GraphQLArgumentConfig
      locale: GraphQLArgumentConfig
      page: GraphQLArgumentConfig
      where: GraphQLArgumentConfig
    } = {} as any

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

    const relationship: GraphQLFieldConfig<any, any, any> = {
      type: withNullableType({
        type: hasManyValues ? new GraphQLList(new GraphQLNonNull(type)) : type,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      args: relationshipArgs,
      extensions: {
        complexity: typeof field?.graphQL?.complexity === 'number' ? field.graphQL.complexity : 10,
      },
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
          return results
        }

        let id = value
        if (isRelatedToManyCollections && value) {
          id = value.value
          relatedCollectionSlug = value.relationTo
        }

        if (id) {
          if (graphQLCollections.some((collection) => collection.slug === relatedCollectionSlug)) {
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
      [formatName(field.name)]: relationship,
    }
  },
  richText: ({ config, field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: {
      type: withNullableType({
        type: GraphQLJSON,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
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
            parentIsLocalized,
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
  row: ({ field, objectTypeConfig, ...rest }) =>
    field.fields.reduce((objectTypeConfigWithRowFields, subField) => {
      const addSubField: GenericFieldToSchemaMap = fieldToSchemaMap[subField.type]
      if (addSubField) {
        return addSubField({
          field: subField,
          objectTypeConfig: objectTypeConfigWithRowFields,
          ...rest,
        })
      }
      return objectTypeConfigWithRowFields
    }, objectTypeConfig),
  select: ({ field, forceNullable, objectTypeConfig, parentIsLocalized, parentName }) => {
    const fullName = combineParentName(parentName, field.name)

    let type: GraphQLOutputType = new GraphQLEnumType({
      name: fullName,
      values: formatOptions(field),
    })

    type = field.hasMany ? new GraphQLList(new GraphQLNonNull(type)) : type
    type = withNullableType({ type, field, forceNullable, parentIsLocalized }) as GraphQLOutputType

    return {
      ...objectTypeConfig,
      [formatName(field.name)]: formattedNameResolver({ type, field }),
    }
  },
  tabs: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    newlyCreatedBlockType,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) =>
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
            parentIsLocalized: tab.localized || parentIsLocalized,
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
          const addSubField: GenericFieldToSchemaMap = fieldToSchemaMap[subField.type]
          if (addSubField) {
            return addSubField({
              config,
              field: subField,
              forceNullable,
              graphqlResult,
              newlyCreatedBlockType,
              objectTypeConfig: subFieldSchema,
              parentIsLocalized,
              parentName,
            })
          }
          return subFieldSchema
        }, tabSchema),
      }
    }, objectTypeConfig),
  text: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type:
          field.hasMany === true
            ? new GraphQLList(new GraphQLNonNull(GraphQLString))
            : GraphQLString,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  textarea: ({ field, forceNullable, objectTypeConfig, parentIsLocalized }) => ({
    ...objectTypeConfig,
    [formatName(field.name)]: formattedNameResolver({
      type: withNullableType({
        type: GraphQLString,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      field,
    }),
  }),
  upload: ({
    config,
    field,
    forceNullable,
    graphqlResult,
    newlyCreatedBlockType,
    objectTypeConfig,
    parentIsLocalized,
    parentName,
  }) => {
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
      draft?: GraphQLArgumentConfig
      fallbackLocale?: GraphQLArgumentConfig
      limit?: GraphQLArgumentConfig
      locale?: GraphQLArgumentConfig
      page?: GraphQLArgumentConfig
      where?: GraphQLArgumentConfig
    } = {} as any

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
      type: withNullableType({
        type: hasManyValues ? new GraphQLList(new GraphQLNonNull(type)) : type,
        field,
        forceNullable,
        parentIsLocalized,
      }) as GraphQLOutputType,
      args: relationshipArgs,
      extensions: {
        complexity: typeof field?.graphQL?.complexity === 'number' ? field.graphQL.complexity : 10,
      },
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
      [formatName(field.name)]: relationship,
    }
  },
}
