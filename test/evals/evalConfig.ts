import type {
  Field,
  FieldSchemaMap,
  SanitizedCollectionConfig,
  SanitizedConfig,
  SanitizedGlobalConfig,
} from 'payload'

import { initI18n } from '@payloadcms/translations'

// eslint-disable-next-line payload/no-relative-monorepo-imports
import { buildFieldSchemaMap } from '../../packages/ui/src/utilities/buildFieldSchemaMap/index.js'

const missingValue = Symbol('missing eval config value')

export type EvalFields = Record<string, Field>

export type EvalCollectionConfig = {
  fields: EvalFields
} & Omit<SanitizedCollectionConfig, 'fields'>

export type EvalGlobalConfig = {
  fields: EvalFields
} & Omit<SanitizedGlobalConfig, 'fields'>

export type EvalConfig = {
  collections: Record<string, EvalCollectionConfig>
  globals: Record<string, EvalGlobalConfig>
  raw: SanitizedConfig
}

type MissingValue = {
  readonly [missingValue]: true
}

const missingProxy = new Proxy(Object.create(null) as MissingValue, {
  get(_target, prop) {
    if (prop === missingValue) {
      return true
    }
    if (prop === 'then') {
      return undefined
    }
    if (prop === Symbol.toStringTag) {
      return 'MissingEvalConfigValue'
    }
    return missingProxy
  },
})

const safeObjectCache = new WeakMap<object, unknown>()

export const isMissingEvalConfigValue = (value: unknown): value is MissingValue =>
  Boolean(value && typeof value === 'object' && (value as MissingValue)[missingValue])

export const unwrapEvalConfigValue = <T>(value: T): T | undefined =>
  isMissingEvalConfigValue(value) ? undefined : value

export async function buildEvalConfig(config: SanitizedConfig): Promise<EvalConfig> {
  const i18n = await initI18n({
    config: config.i18n,
    context: 'client',
    language: 'en',
  })

  const collections: Record<string, EvalCollectionConfig> = {}
  for (const collection of config.collections) {
    const { fieldSchemaMap } = buildFieldSchemaMap({
      collectionSlug: collection.slug,
      config,
      i18n,
    })
    const { fields: _fields, ...collectionConfig } = collection

    collections[collection.slug] = safeObject({
      ...collectionConfig,
      fields: safeRecord(fieldSchemaMapToFields(fieldSchemaMap, collection.slug)),
    }) as EvalCollectionConfig
  }

  const globals: Record<string, EvalGlobalConfig> = {}
  for (const global of config.globals) {
    const { fieldSchemaMap } = buildFieldSchemaMap({
      config,
      globalSlug: global.slug,
      i18n,
    })
    const { fields: _fields, ...globalConfig } = global

    globals[global.slug] = safeObject({
      ...globalConfig,
      fields: safeRecord(fieldSchemaMapToFields(fieldSchemaMap, global.slug)),
    }) as EvalGlobalConfig
  }

  return safeObject({
    collections: safeRecord(collections),
    globals: safeRecord(globals),
    raw: config,
  }) as EvalConfig
}

export function missingEvalConfig(): EvalConfig {
  return safeObject({
    collections: safeRecord({}),
    globals: safeRecord({}),
    raw: missingProxy,
  }) as unknown as EvalConfig
}

function fieldSchemaMapToFields(fieldSchemaMap: FieldSchemaMap, entitySlug: string): EvalFields {
  const fields: EvalFields = {}

  for (const [schemaPath, entry] of fieldSchemaMap.entries()) {
    if (schemaPath === entitySlug || !isField(entry)) {
      continue
    }

    const fieldPath = schemaPath.startsWith(`${entitySlug}.`)
      ? schemaPath.slice(entitySlug.length + 1)
      : schemaPath

    fields[fieldPath] = safeValue(entry) as Field
  }

  return fields
}

function isField(
  entry: FieldSchemaMap extends Map<string, infer Value> ? Value : never,
): entry is Field {
  return Boolean(entry && typeof entry === 'object' && 'type' in entry)
}

function safeRecord<T extends Record<string, unknown>>(record: T): T {
  return safeObject(record)
}

function safeValue(value: unknown): unknown {
  if (value === undefined) {
    return missingProxy
  }
  if (!value || typeof value !== 'object') {
    return value
  }
  if (value instanceof Date || value instanceof Map || value instanceof Set) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(safeValue)
  }

  return safeObject(value)
}

function safeObject<T extends object>(object: T): T {
  const cached = safeObjectCache.get(object)
  if (cached) {
    return cached as T
  }

  const proxy = new Proxy(object, {
    get(target, prop, receiver) {
      if (prop === missingValue) {
        return false
      }
      if (prop === 'then') {
        return undefined
      }
      if (Reflect.has(target, prop)) {
        return safeValue(Reflect.get(target, prop, receiver))
      }
      return missingProxy
    },
  })

  safeObjectCache.set(object, proxy)
  return proxy
}
