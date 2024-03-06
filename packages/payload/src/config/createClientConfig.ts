import type { Field } from '../fields/config/types.d.ts'
import type { ClientConfig, SanitizedConfig } from './types.d.ts'

export const sanitizeField = (f) => {
  const field = { ...f }

  if ('access' in field) delete field.access
  if ('hooks' in field) delete field.hooks
  if ('validate' in field) delete field.validate
  if ('defaultValue' in field) delete field.defaultValue
  if ('label' in field) delete field.label

  if ('fields' in field) {
    field.fields = sanitizeFields(field.fields)
  }

  if ('editor' in field) {
    delete field.editor
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

    if ('components' in field.admin) {
      delete field.admin.components
    }

    if ('condition' in field.admin) {
      delete field.admin.condition
    }

    if ('description' in field.admin) {
      delete field.admin.description
    }
  }

  return field
}

const sanitizeCollections = (
  collections: SanitizedConfig['collections'],
): ClientConfig['collections'] =>
  collections.map((collection) => {
    const sanitized = { ...collection }
    sanitized.fields = sanitizeFields(sanitized.fields)

    delete sanitized.hooks
    delete sanitized.access
    delete sanitized.endpoints

    if ('editor' in sanitized) delete sanitized.editor

    if ('upload' in sanitized && typeof sanitized.upload === 'object') {
      sanitized.upload = { ...sanitized.upload }
      delete sanitized.upload.handlers
    }

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      if ('components' in sanitized.admin) {
        delete sanitized.admin.components
      }

      if ('hidden' in sanitized.admin) {
        delete sanitized.admin.hidden
      }

      if ('preview' in sanitized.admin) {
        delete sanitized.admin.preview
      }
    }

    return sanitized
  })

const sanitizeGlobals = (globals: SanitizedConfig['globals']): ClientConfig['globals'] =>
  globals.map((global) => {
    const sanitized = { ...global }
    sanitized.fields = sanitizeFields(sanitized.fields)
    delete sanitized.hooks
    delete sanitized.access
    delete sanitized.endpoints

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      if ('components' in sanitized.admin) {
        delete sanitized.admin.components
      }

      if ('hidden' in sanitized.admin) {
        delete sanitized.admin.hidden
      }

      if ('preview' in sanitized.admin) {
        delete sanitized.admin.preview
      }
    }

    return sanitized
  })

export const sanitizeFields = (fields: Field[]): Field[] => fields.map(sanitizeField)

export const createClientConfig = async (
  configPromise: Promise<SanitizedConfig> | SanitizedConfig,
): Promise<ClientConfig> => {
  const config = await configPromise
  const clientConfig = { ...config }

  delete clientConfig.endpoints
  delete clientConfig.db
  delete clientConfig.editor
  delete clientConfig.plugins
  delete clientConfig.sharp

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
