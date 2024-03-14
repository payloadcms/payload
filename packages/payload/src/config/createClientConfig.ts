import type { SanitizedCollectionConfig, SanitizedGlobalConfig } from '../exports/types.js'
import type { Field, FieldBase, RichTextField } from '../fields/config/types.js'
import type { ClientConfig, SanitizedConfig } from './types.js'

export const sanitizeField = (f: Field) => {
  const field = { ...f }

  const serverOnlyFieldProperties: Partial<keyof FieldBase | keyof RichTextField>[] = [
    'hooks',
    'access',
    'validate',
    'defaultValue',
    'label',
    // This is a `richText` only property
    'editor',
    // `fields`
    // `blocks`
    // `tabs`
    // `admin`
    // are all handled separately
  ]

  serverOnlyFieldProperties.forEach((key) => {
    if (key in field) {
      delete field[key]
    }
  })

  if ('fields' in field) {
    field.fields = sanitizeFields(field.fields)
  }

  if ('blocks' in field) {
    field.blocks = field.blocks.map((block) => {
      const sanitized = { ...block }
      sanitized.fields = sanitizeFields(sanitized.fields)
      return sanitized
    })
  }

  if ('tabs' in field) {
    // @ts-expect-error
    field.tabs = field.tabs.map((tab) => sanitizeField(tab))
  }

  if ('admin' in field) {
    field.admin = { ...field.admin }

    const serverOnlyFieldAdminProperties = ['components', 'condition', 'description']

    serverOnlyFieldAdminProperties.forEach((key) => {
      if (key in field.admin) {
        delete field.admin[key]
      }
    })
  }

  return field
}

const sanitizeCollections = (
  collections: SanitizedConfig['collections'],
): ClientConfig['collections'] =>
  collections.map((collection) => {
    const sanitized = { ...collection }
    sanitized.fields = sanitizeFields(sanitized.fields)

    const serverOnlyCollectionProperties: Partial<keyof SanitizedCollectionConfig>[] = [
      'hooks',
      'access',
      'endpoints',
      // `upload`
      // `admin`
      // are all handled separately
    ]

    serverOnlyCollectionProperties.forEach((key) => {
      if (key in sanitized) {
        delete sanitized[key]
      }
    })

    if ('upload' in sanitized && typeof sanitized.upload === 'object') {
      sanitized.upload = { ...sanitized.upload }
      delete sanitized.upload.handlers
    }

    if ('auth' in sanitized && typeof sanitized.auth === 'object') {
      sanitized.auth = { ...sanitized.auth }
      delete sanitized.auth.strategies
      delete sanitized.auth.forgotPassword
      delete sanitized.auth.verify
    }

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      const serverOnlyCollectionAdminProperties: Partial<
        keyof SanitizedCollectionConfig['admin']
      >[] = ['components', 'hidden', 'preview', 'hooks']

      serverOnlyCollectionAdminProperties.forEach((key) => {
        if (key in sanitized.admin) {
          delete sanitized.admin[key]
        }
      })
    }

    return sanitized
  })

const sanitizeGlobals = (globals: SanitizedConfig['globals']): ClientConfig['globals'] =>
  globals.map((global) => {
    const sanitized = { ...global }
    sanitized.fields = sanitizeFields(sanitized.fields)

    const serverOnlyProperties: Partial<keyof SanitizedGlobalConfig>[] = [
      'hooks',
      'access',
      'endpoints',
      // `admin`
      // is handled separately
    ]

    serverOnlyProperties.forEach((key) => {
      if (key in sanitized) {
        delete sanitized[key]
      }
    })

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      const serverOnlyGlobalAdminProperties: Partial<keyof SanitizedGlobalConfig['admin']>[] = [
        'components',
        'hidden',
        'preview',
      ]

      serverOnlyGlobalAdminProperties.forEach((key) => {
        if (key in sanitized.admin) {
          delete sanitized.admin[key]
        }
      })
    }

    return sanitized
  })

export const sanitizeFields = (fields: Field[]): Field[] => fields.map(sanitizeField)

export const createClientConfig = async (
  configPromise: Promise<SanitizedConfig> | SanitizedConfig,
): Promise<ClientConfig> => {
  const config = await configPromise
  const clientConfig = { ...config }

  const serverOnlyConfigProperties: Partial<keyof SanitizedConfig>[] = [
    'endpoints',
    'db',
    'editor',
    'plugins',
    'sharp',
    // `admin`
    // `onInit`
    // `localization`
    // `collections`
    // `globals`
    // are all handled separately
  ]

  serverOnlyConfigProperties.forEach((key) => {
    if (key in clientConfig) {
      delete clientConfig[key]
    }
  })

  if ('localization' in clientConfig && clientConfig.localization) {
    clientConfig.localization = { ...clientConfig.localization }

    clientConfig.localization.locales.forEach((locale) => {
      delete locale.toString
    })
  }

  if ('admin' in clientConfig) {
    clientConfig.admin = { ...clientConfig.admin }

    const serverOnlyAdminProperties: Partial<keyof SanitizedConfig['admin']>[] = ['components']

    serverOnlyAdminProperties.forEach((key) => {
      if (key in clientConfig.admin) {
        delete clientConfig.admin[key]
      }
    })
  }

  clientConfig.onInit = undefined

  clientConfig.collections = sanitizeCollections(clientConfig.collections)
  clientConfig.globals = sanitizeGlobals(clientConfig.globals)

  return clientConfig
}
