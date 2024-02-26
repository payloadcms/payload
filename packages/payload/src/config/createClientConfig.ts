import type { Field } from '../fields/config/types'
import type { ClientConfig, SanitizedConfig } from './types'

const sanitizeFields = (fields: Field[]): Field[] =>
  fields.map((field) => {
    const sanitized = { ...field }

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

    return sanitized
  })

export const createClientConfig = async (
  configPromise: Promise<SanitizedConfig>,
): Promise<ClientConfig> => {
  const config = await configPromise
  const clientConfig = { ...config }

  delete clientConfig.endpoints
  delete clientConfig.db

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
