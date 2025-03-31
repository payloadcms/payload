import type {
  CollectionConfig,
  Field,
  GlobalConfig,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import { toWords } from 'payload'

import { GraphQLJSONObject } from '../packages/graphql-type-json/index.js'
import { formatName } from '../utilities/formatName.js'

type OperationType = 'create' | 'delete' | 'read' | 'readVersions' | 'unlock' | 'update'

type AccessScopes = 'docAccess' | undefined

type ObjectTypeFields = {
  [key in 'fields' | OperationType]?: { type: GraphQLObjectType }
}

const buildFields = (label, fieldsToBuild) =>
  fieldsToBuild.reduce((builtFields, field) => {
    const includeField = !field.hidden && field.type !== 'ui'
    if (includeField) {
      if (field.name) {
        const fieldName = formatName(field.name)

        const objectTypeFields: ObjectTypeFields = ['create', 'read', 'update', 'delete'].reduce(
          (operations, operation) => {
            const capitalizedOperation = operation.charAt(0).toUpperCase() + operation.slice(1)

            return {
              ...operations,
              [operation]: {
                type: new GraphQLObjectType({
                  name: `${label}_${fieldName}_${capitalizedOperation}`,
                  fields: {
                    permission: {
                      type: new GraphQLNonNull(GraphQLBoolean),
                    },
                  },
                }),
              },
            }
          },
          {},
        )

        if (field.fields) {
          objectTypeFields.fields = {
            type: new GraphQLObjectType({
              name: `${label}_${fieldName}_Fields`,
              fields: buildFields(`${label}_${fieldName}`, field.fields),
            }),
          }
        }

        return {
          ...builtFields,
          [formatName(field.name)]: {
            type: new GraphQLObjectType({
              name: `${label}_${fieldName}`,
              fields: objectTypeFields,
            }),
          },
        }
      }

      if (!field.name && field.fields) {
        const subFields = buildFields(label, field.fields)

        return {
          ...builtFields,
          ...subFields,
        }
      }

      if (field.type === 'tabs') {
        return field.tabs.reduce(
          (fieldsWithTabFields, tab) => {
            return {
              ...fieldsWithTabFields,
              ...buildFields(label, tab.fields),
            }
          },
          { ...builtFields },
        )
      }
    }
    return builtFields
  }, {})

type BuildEntityPolicy = {
  entityFields: Field[]
  name: string
  operations: OperationType[]
  scope: AccessScopes
}
export const buildEntityPolicy = (args: BuildEntityPolicy) => {
  const { name, entityFields, operations, scope } = args

  const fieldsTypeName = toWords(`${name}-${scope || ''}-Fields`, true)
  const fields = {
    fields: {
      type: new GraphQLObjectType({
        name: fieldsTypeName,
        fields: buildFields(fieldsTypeName, entityFields),
      }),
    },
  }

  operations.forEach((operation) => {
    const operationTypeName = toWords(`${name}-${operation}-${scope || 'Access'}`, true)

    fields[operation] = {
      type: new GraphQLObjectType({
        name: operationTypeName,
        fields: {
          permission: { type: new GraphQLNonNull(GraphQLBoolean) },
          where: { type: GraphQLJSONObject },
        },
      }),
    }
  })

  return fields
}

type BuildPolicyType = {
  scope?: AccessScopes
  typeSuffix?: string
} & (
  | {
      entity: CollectionConfig
      type: 'collection'
    }
  | {
      entity: GlobalConfig
      type: 'global'
    }
)
export function buildPolicyType(args: BuildPolicyType): GraphQLObjectType {
  const { type, entity, scope, typeSuffix } = args
  const { slug, fields, graphQL, versions } = entity

  let operations = []

  if (graphQL === false) {
    return null
  }

  if (type === 'collection') {
    operations = ['create', 'read', 'update', 'delete']

    if (
      entity.auth &&
      typeof entity.auth === 'object' &&
      typeof entity.auth.maxLoginAttempts !== 'undefined' &&
      entity.auth.maxLoginAttempts !== 0
    ) {
      operations.push('unlock')
    }

    if (versions) {
      operations.push('readVersions')
    }

    const collectionTypeName = formatName(`${slug}${typeSuffix || ''}`)

    return new GraphQLObjectType({
      name: collectionTypeName,
      fields: buildEntityPolicy({
        name: slug,
        entityFields: fields,
        operations,
        scope,
      }),
    })
  }

  // else create global type
  operations = ['read', 'update']

  if (entity.versions) {
    operations.push('readVersions')
  }

  const globalTypeName = formatName(`${global?.graphQL?.name || slug}${typeSuffix || ''}`)

  return new GraphQLObjectType({
    name: globalTypeName,
    fields: buildEntityPolicy({
      name: entity.graphQL ? entity?.graphQL?.name || slug : slug,
      entityFields: entity.fields,
      operations,
      scope,
    }),
  })
}

export function buildPoliciesType(config: SanitizedConfig): GraphQLObjectType {
  const fields = {
    canAccessAdmin: {
      type: new GraphQLNonNull(GraphQLBoolean),
    },
  }

  Object.values(config.collections).forEach((collection: SanitizedCollectionConfig) => {
    if (collection.graphQL === false) {
      return
    }
    const collectionPolicyType = buildPolicyType({
      type: 'collection',
      entity: collection,
      typeSuffix: 'Access',
    })

    fields[formatName(collection.slug)] = {
      type: collectionPolicyType,
    }
  })

  Object.values(config.globals).forEach((global: SanitizedGlobalConfig) => {
    if (global.graphQL === false) {
      return
    }
    const globalPolicyType = buildPolicyType({
      type: 'global',
      entity: global,
      typeSuffix: 'Access',
    })

    fields[formatName(global.slug)] = {
      type: globalPolicyType,
    }
  })

  return new GraphQLObjectType({
    name: 'Access',
    fields,
  })
}
