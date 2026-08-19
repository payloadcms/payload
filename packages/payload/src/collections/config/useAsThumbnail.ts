import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { flattenTopLevelFields } from '../../utilities/flattenTopLevelFields.js'

/**
 * Validate useAsThumbnail for collections.
 */
export const validateUseAsThumbnail = (config: CollectionConfig) => {
  if (!config.admin?.useAsThumbnail) {
    return
  }

  if (config.admin.useAsThumbnail.includes('.')) {
    throw new InvalidConfiguration(
      `"useAsThumbnail" cannot be a nested field. Please specify a top-level field in the collection "${config.slug}"`,
    )
  }

  const fields = flattenTopLevelFields(config.fields)
  const useAsThumbnailField = fields.find((field) => {
    if (fieldAffectsData(field)) {
      return field.name === config.admin?.useAsThumbnail
    }
    return false
  })

  if (!useAsThumbnailField) {
    throw new InvalidConfiguration(
      `The field "${config.admin.useAsThumbnail}" specified in "admin.useAsThumbnail" does not exist in the collection "${config.slug}"`,
    )
  }

  if (useAsThumbnailField.type !== 'upload') {
    throw new InvalidConfiguration(
      `The field "${config.admin.useAsThumbnail}" specified in "admin.useAsThumbnail" in the collection "${config.slug}" must be of type "upload"`,
    )
  }
}
