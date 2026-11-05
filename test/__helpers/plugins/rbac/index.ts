import type {
  Access,
  CollectionConfig,
  CollectionSlug,
  Config,
  Field,
  FieldAccess,
  FieldSchemaMap,
  GlobalConfig,
  GlobalSlug,
  Payload,
  PayloadRequest,
  SanitizedConfig,
  Tab,
  TabAsField,
} from 'payload'

import { traverseFields } from '@payloadcms/ui/utilities/buildFieldSchemaMap/traverseFields'
import { defaultUserCollection, definePlugin, flattenAllFields, getLocalI18n } from 'payload'
import { fieldAffectsData } from 'payload/shared'

type CollectionOperation = keyof NonNullable<CollectionConfig['access']>
type CollectionAdminAccess = NonNullable<NonNullable<CollectionConfig['access']>['admin']>
type FieldOperation = 'create' | 'read' | 'update'
type GlobalOperation = keyof NonNullable<GlobalConfig['access']>

/** A full Payload field schema path rooted at its collection or global slug. */
export type FieldSchemaPath = `${string}.${string}`

/**
 * Per-user access rules consumed by `testRBACPlugin`.
 *
 * These rules are deny-only. The RBAC layer defaults every operation to allowed, and the only
 * configurable value is `false`. A missing rule leaves the entity or field's existing access
 * result unchanged. Field rules use full Payload schema paths and can control `create`, `read`,
 * and `update` independently. If one field is reused at multiple schema paths, a denial at any
 * path denies every occurrence of that shared field.
 */
export type TestRBAC = {
  collections?: {
    [Slug in CollectionSlug]?: Partial<Record<CollectionOperation, false>>
  }
  fields?: Partial<Record<FieldSchemaPath, Partial<Record<FieldOperation, false>>>>
  globals?: {
    [Slug in GlobalSlug]?: Partial<Record<GlobalOperation, false>>
  }
}

/**
 * Adds a JWT-backed `rbac` field to the admin user collection and applies deny-only RBAC rules
 * to every collection, global, and data field.
 *
 * Existing access control always runs first and remains authoritative. If it denies access, the
 * result stays denied. If it allows access, an explicit `false` RBAC rule can still deny it. A
 * missing RBAC rule never turns an existing denial into an allow. Collection and global query
 * constraints are returned unchanged when RBAC does not deny access.
 *
 * The plugin runs after normal-priority plugins so it can include fields and entities they add.
 *
 * This test helper mutates the supplied config and should be applied once per config.
 */
export const testRBACPlugin = definePlugin({
  slug: 'test-rbac',
  order: Number.MAX_SAFE_INTEGER,
  plugin: ({ config }) => {
    const fieldSchemaPathSets = new Set<Set<FieldSchemaPath>>()
    const rbacAccessFunctions = new WeakSet<object>()
    const schemaPathsByField = new WeakMap<object, Set<FieldSchemaPath>>()
    const userCollection = getUserCollection({ config })

    if (!userCollection.fields.some((field) => 'name' in field && field.name === 'rbac')) {
      userCollection.fields.push({
        name: 'rbac',
        type: 'json',
        saveToJWT: true,
      })
    }

    const previousOnInit = config.onInit

    config.onInit = async (payload) => {
      addEntityAccess({ config: payload.config, rbacAccessFunctions })
      await addFieldAccess({ fieldSchemaPathSets, payload, schemaPathsByField })
      await previousOnInit?.(payload)
    }

    return config
  },
})

function addEntityAccess({
  config,
  rbacAccessFunctions,
}: {
  config: SanitizedConfig
  rbacAccessFunctions: WeakSet<object>
}): SanitizedConfig {
  for (const collection of config.collections) {
    const collectionSlug = collection.slug
    const existingAccess = collection.access

    collection.access = {
      ...existingAccess,
      admin: composeAdminAccess({
        existingAccess: existingAccess.admin,
        hasRBACAccess: ({ req }) =>
          hasCollectionAccess({ collectionSlug, operation: 'admin', req }),
        rbacAccessFunctions,
      }),
      create: composeEntityAccess({
        existingAccess: existingAccess.create,
        hasRBACAccess: ({ req }) =>
          hasCollectionAccess({ collectionSlug, operation: 'create', req }),
        rbacAccessFunctions,
      }),
      delete: composeEntityAccess({
        existingAccess: existingAccess.delete,
        hasRBACAccess: ({ req }) =>
          hasCollectionAccess({ collectionSlug, operation: 'delete', req }),
        rbacAccessFunctions,
      }),
      read: composeEntityAccess({
        existingAccess: existingAccess.read,
        hasRBACAccess: ({ req }) => hasCollectionAccess({ collectionSlug, operation: 'read', req }),
        rbacAccessFunctions,
      }),
      readVersions: composeEntityAccess({
        existingAccess: existingAccess.readVersions,
        hasRBACAccess: ({ req }) =>
          hasCollectionAccess({ collectionSlug, operation: 'readVersions', req }),
        rbacAccessFunctions,
      }),
      unlock: composeEntityAccess({
        existingAccess: existingAccess.unlock,
        hasRBACAccess: ({ req }) =>
          hasCollectionAccess({ collectionSlug, operation: 'unlock', req }),
        rbacAccessFunctions,
      }),
      update: composeEntityAccess({
        existingAccess: existingAccess.update,
        hasRBACAccess: ({ req }) =>
          hasCollectionAccess({ collectionSlug, operation: 'update', req }),
        rbacAccessFunctions,
      }),
    }
  }

  for (const global of config.globals) {
    const globalSlug = global.slug
    const existingAccess = global.access

    global.access = {
      ...existingAccess,
      read: composeEntityAccess({
        existingAccess: existingAccess.read,
        hasRBACAccess: ({ req }) => hasGlobalAccess({ globalSlug, operation: 'read', req }),
        rbacAccessFunctions,
      }),
      readVersions: composeEntityAccess({
        existingAccess: existingAccess.readVersions,
        hasRBACAccess: ({ req }) => hasGlobalAccess({ globalSlug, operation: 'readVersions', req }),
        rbacAccessFunctions,
      }),
      update: composeEntityAccess({
        existingAccess: existingAccess.update,
        hasRBACAccess: ({ req }) => hasGlobalAccess({ globalSlug, operation: 'update', req }),
        rbacAccessFunctions,
      }),
    }
  }

  return config
}

function composeAdminAccess({
  existingAccess,
  hasRBACAccess,
  rbacAccessFunctions,
}: {
  existingAccess: CollectionAdminAccess | undefined
  hasRBACAccess: CollectionAdminAccess
  rbacAccessFunctions: WeakSet<object>
}): CollectionAdminAccess {
  if (existingAccess && rbacAccessFunctions.has(existingAccess)) {
    return existingAccess
  }

  const composedAccess: CollectionAdminAccess = async (args) => {
    const existingResult = existingAccess
      ? await existingAccess(args)
      : args.req.user?.collection === args.req.payload.config.admin.user

    if (!existingResult) {
      return false
    }

    return hasRBACAccess(args)
  }

  rbacAccessFunctions.add(composedAccess)

  return composedAccess
}

function composeEntityAccess({
  existingAccess,
  hasRBACAccess,
  rbacAccessFunctions,
}: {
  existingAccess: Access | undefined
  hasRBACAccess: (args: Parameters<Access>[0]) => boolean | Promise<boolean>
  rbacAccessFunctions: WeakSet<object>
}): Access {
  if (existingAccess && rbacAccessFunctions.has(existingAccess)) {
    return existingAccess
  }

  const composedAccess: Access = async (args) => {
    const existingResult = existingAccess ? await existingAccess(args) : Boolean(args.req.user)

    if (existingResult === false) {
      return false
    }

    return (await hasRBACAccess(args)) ? existingResult : false
  }

  rbacAccessFunctions.add(composedAccess)

  return composedAccess
}

async function addFieldAccess({
  fieldSchemaPathSets,
  payload,
  schemaPathsByField,
}: {
  fieldSchemaPathSets: Set<Set<FieldSchemaPath>>
  payload: Payload
  schemaPathsByField: WeakMap<object, Set<FieldSchemaPath>>
}): Promise<Payload> {
  const i18n = await getLocalI18n({
    config: payload.config,
    language: payload.config.i18n.fallbackLanguage,
  })

  for (const schemaPaths of fieldSchemaPathSets) {
    schemaPaths.clear()
  }

  for (const collection of payload.config.collections) {
    addFieldAccessForEntity({
      fields: collection.fields,
      fieldSchemaPathSets,
      i18n,
      parentSchemaPath: collection.slug,
      payload,
      schemaPathsByField,
    })

    collection.flattenedFields = flattenAllFields({ fields: collection.fields })
  }

  for (const global of payload.config.globals) {
    addFieldAccessForEntity({
      fields: global.fields,
      fieldSchemaPathSets,
      i18n,
      parentSchemaPath: global.slug,
      payload,
      schemaPathsByField,
    })

    global.flattenedFields = flattenAllFields({ fields: global.fields })
  }

  for (const block of payload.config.blocks ?? []) {
    block.flattenedFields = flattenAllFields({ fields: block.fields })
  }

  return payload
}

function addFieldAccessForEntity({
  fields,
  fieldSchemaPathSets,
  i18n,
  parentSchemaPath,
  payload,
  schemaPathsByField,
}: {
  fields: Field[]
  fieldSchemaPathSets: Set<Set<FieldSchemaPath>>
  i18n: Awaited<ReturnType<typeof getLocalI18n>>
  parentSchemaPath: string
  payload: Payload
  schemaPathsByField: WeakMap<object, Set<FieldSchemaPath>>
}): Field[] {
  const fieldSchemaMap: FieldSchemaMap = new Map()

  traverseFields({
    config: payload.config,
    fields,
    i18n,
    parentIndexPath: '',
    parentSchemaPath,
    schemaMap: fieldSchemaMap,
  })

  addFieldSchemaMapAccess({ fieldSchemaMap, fieldSchemaPathSets, schemaPathsByField })

  return fields
}

function addFieldSchemaMapAccess({
  fieldSchemaMap,
  fieldSchemaPathSets,
  schemaPathsByField,
}: {
  fieldSchemaMap: FieldSchemaMap
  fieldSchemaPathSets: Set<Set<FieldSchemaPath>>
  schemaPathsByField: WeakMap<object, Set<FieldSchemaPath>>
}): FieldSchemaMap {
  const tabsByFields = new Map<Field[], Tab>()
  const namedTabPaths: FieldSchemaPath[] = []

  for (const schema of fieldSchemaMap.values()) {
    if ('type' in schema && schema.type === 'tabs') {
      for (const tab of schema.tabs) {
        tabsByFields.set(tab.fields, tab)
      }
    }
  }

  for (const [schemaPath, schema] of fieldSchemaMap) {
    const field = schema as Field | TabAsField

    if (field.type === 'tab' && fieldAffectsData(field) && tabsByFields.has(field.fields)) {
      namedTabPaths.push(schemaPath as FieldSchemaPath)
    }
  }

  for (const [schemaPath, schema] of fieldSchemaMap) {
    const field = schema as Field | TabAsField

    if (!('type' in field) || !fieldAffectsData(field)) {
      continue
    }

    const actualSchema = field.type === 'tab' ? tabsByFields.get(field.fields) : field

    if (!actualSchema) {
      continue
    }

    const existingSchemaPaths = schemaPathsByField.get(actualSchema)
    const fieldSchemaPaths = existingSchemaPaths ?? new Set<FieldSchemaPath>()

    if (!existingSchemaPaths) {
      schemaPathsByField.set(actualSchema, fieldSchemaPaths)
      fieldSchemaPathSets.add(fieldSchemaPaths)
    }

    fieldSchemaPaths.add(schemaPath as FieldSchemaPath)

    // Payload inherits named-tab permissions without evaluating access on the tab itself.
    // Checking the tab path on its children makes that schema path controllable too.
    for (const namedTabPath of namedTabPaths) {
      if (schemaPath.startsWith(`${namedTabPath}.`)) {
        fieldSchemaPaths.add(namedTabPath)
      }
    }

    if (existingSchemaPaths) {
      continue
    }

    const existingAccess = actualSchema.access

    actualSchema.access = {
      create: composeFieldAccess({
        existingAccess: existingAccess?.create,
        operation: 'create',
        schemaPaths: fieldSchemaPaths,
      }),
      read: composeFieldAccess({
        existingAccess: existingAccess?.read,
        operation: 'read',
        schemaPaths: fieldSchemaPaths,
      }),
      update: composeFieldAccess({
        existingAccess: existingAccess?.update,
        operation: 'update',
        schemaPaths: fieldSchemaPaths,
      }),
    }
  }

  return fieldSchemaMap
}

function composeFieldAccess({
  existingAccess,
  operation,
  schemaPaths,
}: {
  existingAccess: FieldAccess | undefined
  operation: FieldOperation
  schemaPaths: Set<FieldSchemaPath>
}): FieldAccess {
  return async (args) => {
    const existingResult = existingAccess ? await existingAccess(args) : true

    if (!existingResult) {
      return false
    }

    return hasFieldAccess({ operation, req: args.req, schemaPaths })
  }
}

function getUserCollection({ config }: { config: Config }): CollectionConfig {
  const configuredUserSlug = config.admin?.user
  const collections = (config.collections ??= [])

  if (configuredUserSlug) {
    const configuredUserCollection = collections.find(
      (collection) => collection.slug === configuredUserSlug,
    )

    if (!configuredUserCollection?.auth) {
      throw new Error(
        `The test RBAC plugin requires "${configuredUserSlug}" to be an auth-enabled collection.`,
      )
    }

    return configuredUserCollection
  }

  const firstAuthCollection = collections.find((collection) => Boolean(collection.auth))

  if (firstAuthCollection) {
    ;(config.admin ??= {}).user = firstAuthCollection.slug

    return firstAuthCollection
  }

  const userCollection: CollectionConfig = {
    ...defaultUserCollection,
    _sanitized: undefined,
    admin: defaultUserCollection.admin ? { ...defaultUserCollection.admin } : undefined,
    auth:
      typeof defaultUserCollection.auth === 'object'
        ? { ...defaultUserCollection.auth }
        : defaultUserCollection.auth,
    fields: [],
    labels:
      typeof defaultUserCollection.labels === 'object'
        ? { ...defaultUserCollection.labels }
        : defaultUserCollection.labels,
  }

  collections.push(userCollection)
  ;(config.admin ??= {}).user = userCollection.slug

  return userCollection
}

function getRBAC({ req }: { req: PayloadRequest }): TestRBAC | undefined {
  return (req.user as { rbac?: null | TestRBAC } | null)?.rbac ?? undefined
}

function hasCollectionAccess({
  collectionSlug,
  operation,
  req,
}: {
  collectionSlug: string
  operation: CollectionOperation
  req: PayloadRequest
}): boolean {
  return getRBAC({ req })?.collections?.[collectionSlug as CollectionSlug]?.[operation] !== false
}

function hasFieldAccess({
  operation,
  req,
  schemaPaths,
}: {
  operation: FieldOperation
  req: PayloadRequest
  schemaPaths: Set<FieldSchemaPath>
}): boolean {
  const fieldAccess = getRBAC({ req })?.fields

  for (const schemaPath of schemaPaths) {
    if (fieldAccess?.[schemaPath]?.[operation] === false) {
      return false
    }
  }

  return true
}

function hasGlobalAccess({
  globalSlug,
  operation,
  req,
}: {
  globalSlug: string
  operation: GlobalOperation
  req: PayloadRequest
}): boolean {
  return getRBAC({ req })?.globals?.[globalSlug as GlobalSlug]?.[operation] !== false
}
