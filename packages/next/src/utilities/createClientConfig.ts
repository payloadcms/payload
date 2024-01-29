import type { Field, ClientConfig, SanitizedConfig } from 'payload/types'

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

    if ('admin' in sanitized) {
      sanitized.admin = { ...sanitized.admin }

      if ('components' in sanitized.admin) {
        delete sanitized.admin.components
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
    }

    return sanitized
  })

export const sanitizeFields = (fields: Field[]): Field[] => fields.map(sanitizeField)

export const createClientConfig = async (
  configPromise: SanitizedConfig | Promise<SanitizedConfig>,
): Promise<ClientConfig> => {
  const config = await configPromise
  const clientConfig = { ...config }

  delete clientConfig.endpoints
  delete clientConfig.db
  clientConfig.onInit = undefined

  clientConfig.collections = sanitizeCollections(clientConfig.collections)
  clientConfig.globals = sanitizeGlobals(clientConfig.globals)

  return clientConfig
}
