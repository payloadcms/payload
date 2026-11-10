import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { flattenTopLevelFields } from '../../utilities/flattenTopLevelFields.js'

/**
 * Validate listSearchableFields for collections.
 * Ensures that all fields specified in admin.listSearchableFields exist in the collection.
 */
export const validateListSearchableFields = (config: CollectionConfig) => {
  if (!config.admin?.listSearchableFields) {
    return
  }

  const fields = flattenTopLevelFields(config.fields)
  const fieldNames = new Set(
    fields.filter((field) => fieldAffectsData(field)).map((field) => field.name),
  )
  // 'id' is always a valid field
  fieldNames.add('id')

  for (const fieldName of config.admin.listSearchableFields) {
    if (!fieldNames.has(fieldName)) {
      throw new InvalidConfiguration(
        `The field "${fieldName}" specified in "admin.listSearchableFields" does not exist in the collection "${config.slug}". Valid fields are: ${Array.from(fieldNames).join(', ')}`,
      )
    }
  }
}
