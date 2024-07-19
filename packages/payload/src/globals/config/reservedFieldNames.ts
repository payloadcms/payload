import type { Field } from '../../fields/config/types.js'
import type { GlobalConfig } from '../../index.js'

import { ReservedFieldName } from '../../errors/ReservedFieldName.js'
import { fieldAffectsData } from '../../fields/config/types.js'

/**
 * Reserved field names for collections with versions enabled
 */
const reservedVersionsFieldNames = ['__v', '_status']

/**
 * Sanitize fields for collections with versions enabled.
 *
 * Should run on top level fields only.
 */
export const sanitizeVersionsFields = (fields: Field[], config: GlobalConfig) => {
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]

    if (fieldAffectsData(field) && field.name) {
      if (config.versions) {
        if (reservedVersionsFieldNames.includes(field.name)) {
          throw new ReservedFieldName(field, field.name)
        }
      }
    }

    // Handle tabs without a name
    if (field.type === 'tabs') {
      for (let j = 0; j < field.tabs.length; j++) {
        const tab = field.tabs[j]

        if (!('name' in tab)) {
          sanitizeVersionsFields(tab.fields, config)
        }
      }
    }

    // Handle presentational fields like rows and collapsibles
    if (!fieldAffectsData(field) && 'fields' in field && field.fields) {
      sanitizeVersionsFields(field.fields, config)
    }
  }
}
