import type { FieldPermissions } from 'payload/auth'
import type { SanitizedConfig } from 'payload/types'
import { buildFieldMap } from './buildFieldMap'
import { FieldMap } from './types'

export const buildFieldMaps = (args: {
  config: SanitizedConfig
  operation?: 'create' | 'update'
  permissions?:
    | {
        [field: string]: FieldPermissions
      }
    | FieldPermissions
  readOnly?: boolean
}): {
  [key: string]: FieldMap
} => {
  const { config, operation = 'update', permissions, readOnly: readOnlyOverride } = args

  return [...(config.collections || []), ...(config?.globals || [])].reduce((acc, docConfig) => {
    const { fields, slug } = docConfig

    const mappedFields = buildFieldMap({
      fieldSchema: fields,
      operation,
      permissions,
      readOnly: readOnlyOverride,
    })

    return {
      ...acc,
      [slug]: mappedFields,
    }
  }, {})
}
