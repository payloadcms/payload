import type { Field } from '../fields/config/types.js'
import type { ClientConfig, SanitizedConfig } from './types.js'

export const sanitizeField = (f) => {
  const field = { ...f }

  const serverOnlyFieldProperties = [
    'hooks',
    'access',
    'validate',
    'defaultValue',
    'label',
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

    const serverOnlyCollectionProperties = [
      'hooks',
      'access',
      'endpoints',
      'editor',
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

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      const serverOnlyCollectionAdminProperties = ['components', 'hidden', 'preview', 'actions']

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

    const serverOnlyProperties = [
      'hooks',
      'access',
      'endpoints',
      'editor',
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

      const serverOnlyProperties = ['components', 'hidden', 'preview', 'actions']

      serverOnlyProperties.forEach((key) => {
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

  const serverOnlyConfigProperties = [
    'endpoints',
    'db',
    'editor',
    'plugins',
    'sharp',
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

  'localization' in clientConfig &&
    clientConfig.localization &&
    clientConfig.localization.locales.forEach((locale) => {
      delete locale.toString
    })

  clientConfig.onInit = undefined

  clientConfig.collections = sanitizeCollections(clientConfig.collections)
  clientConfig.globals = sanitizeGlobals(clientConfig.globals)

  return clientConfig
}
