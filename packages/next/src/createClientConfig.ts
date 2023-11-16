import type { Field, ClientConfig, SanitizedConfig } from 'payload/types'

const sanitizeFields = (fields: Field[]): Field[] =>
  fields.map((f) => {
    const field = { ...f }

    if ('access' in field) delete field.access
    if ('hooks' in field) delete field.hooks
    if ('validate' in field) delete field.validate
    if ('defaultValue' in field) delete field.defaultValue

    if ('fields' in field) {
      field.fields = sanitizeFields(field.fields)
    }

    if ('admin' in field) {
      if ('components' in field.admin) {
        delete field.admin.components
      }
    }

    return field
  })

export const createClientConfig = async (
  configPromise: SanitizedConfig | Promise<SanitizedConfig>,
): Promise<ClientConfig> => {
  const config = await configPromise
  const clientConfig = { ...config }

  delete clientConfig.endpoints
  delete clientConfig.db
  delete clientConfig.admin.webpack
  delete clientConfig.admin.vite

  clientConfig.collections = config.collections.map((collection) => {
    const sanitized = { ...collection }
    sanitized.fields = sanitizeFields(sanitized.fields)
    delete sanitized.hooks
    delete sanitized.access
    delete sanitized.endpoints
    return sanitized
  })

  clientConfig.globals = config.globals.map((global) => {
    const sanitized = { ...global }
    sanitized.fields = sanitizeFields(sanitized.fields)
    delete sanitized.hooks
    delete sanitized.access
    delete sanitized.endpoints
    return sanitized
  })

  return clientConfig
}
