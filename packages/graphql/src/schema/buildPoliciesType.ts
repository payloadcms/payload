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

type OperationType =
  | 'create'
  | 'delete'
  | 'read'
  | 'readVersions'
  | 'unlock'
  | 'update'
  | 'validate'

type AccessScopes = 'docAccess' | undefined

type PolicyFieldConfig = {
  resolve?: (parent: unknown) => unknown
  type: GraphQLObjectType
}

type ObjectTypeFields = {
  [key in 'fields' | OperationType]?: PolicyFieldConfig
}

/**
 * `accessOperation` and `docAccessOperation` return sanitized permissions: an operation allowed
 * without a `where` constraint is collapsed to `true`, a field (or `fields` object) whose
 * operations are all allowed is collapsed to `true`, and operations that are not allowed are removed.
 * The resolvers below map these values back to the `{ permission, where }` shape of the policy types.
 */
const resolveOperationPermission = (operation: string) => (parent: unknown) => {
  if (parent === true) {
    return { permission: true }
  }

  const value = (parent as Record<string, unknown> | undefined)?.[operation]

  if (value === true) {
    return { permission: true }
  }

  if (value && typeof value === 'object') {
    return value
  }

  return { permission: false }
}

/**
 * Resolves a nested permissions object by its key. If the parent is `true`, everything below it is
 * allowed. If the key was removed during sanitization, everything below it is denied.
 */
const resolveNestedPermissions = (key: string) => (parent: unknown) =>
  parent === true ? true : ((parent as Record<string, unknown> | undefined)?.[key] ?? {})

const buildFields = (label, fieldsToBuild) =>
  fieldsToBuild.reduce((builtFields, field) => {
    const includeField = !field.hidden && field.type !== 'ui'
    if (includeField) {
      if (field.name) {
        const fieldName = formatName(field.name)

        const objectTypeFields: ObjectTypeFields = [
          'create',
          'read',
          'update',
          'delete',
          'validate',
        ].reduce((operations, operation) => {
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
              resolve: resolveOperationPermission(operation),
            },
          }
        }, {})

        const subFields = field.fields && buildFields(`${label}_${fieldName}`, field.fields)

        if (subFields && Object.keys(subFields).length > 0) {
          objectTypeFields.fields = {
            type: new GraphQLObjectType({
              name: `${label}_${fieldName}_Fields`,
              fields: subFields,
            }),
            resolve: resolveNestedPermissions('fields'),
          }
        }

        return {
          ...builtFields,
          [formatName(field.name)]: {
            type: new GraphQLObjectType({
              name: `${label}_${fieldName}`,
              fields: objectTypeFields,
            }),
            // Permissions are keyed by the field name, which can differ from the formatted GraphQL name
            resolve: resolveNestedPermissions(field.name),
          },
        }
      }

      if (!field.name && field.fields && field.fields.length) {
        const subFields = buildFields(label, field.fields)

        return {
          ...builtFields,
          ...subFields,
        }
      }

      if (field.type === 'tabs') {
        return field.tabs.reduce(
          (fieldsWithTabFields, tab) => {
            if ('name' in tab) {
              const tabName = formatName(tab.name)
              const subFields = buildFields(`${label}_${tabName}`, tab.fields)

              if (Object.keys(subFields).length > 0) {
                fieldsWithTabFields[tabName] = {
                  type: new GraphQLObjectType({
                    name: `${label}_${tabName}`,
                    fields: subFields,
                  }),
                  // A named tab's field permissions are nested under its `fields` key
                  resolve: (parent: unknown) =>
                    resolveNestedPermissions('fields')(resolveNestedPermissions(tab.name)(parent)),
                }
              }
              return fieldsWithTabFields
            }
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
  const policyFields = buildFields(fieldsTypeName, entityFields)
  const fields: ObjectTypeFields = {}

  if (Object.keys(policyFields).length > 0) {
    fields.fields = {
      type: new GraphQLObjectType({
        name: fieldsTypeName,
        fields: policyFields,
      }),
      resolve: resolveNestedPermissions('fields'),
    }
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
      resolve: resolveOperationPermission(operation),
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
    operations = ['create', 'read', 'update', 'delete', 'validate']

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
  operations = ['read', 'update', 'validate']

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
