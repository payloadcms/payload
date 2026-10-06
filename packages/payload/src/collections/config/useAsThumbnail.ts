import type { SanitizedCollectionConfig } from './types.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { fieldAffectsData } from '../../fields/config/types.js'

/** Validate useAsThumbnail for collections. */
export const validateUseAsThumbnail = ({ config }: { config: SanitizedCollectionConfig }) => {
  if (!config.admin?.useAsThumbnail) {
    return
  }

  if (config.admin.useAsThumbnail.includes('.')) {
    throw new InvalidConfiguration(
      `"useAsThumbnail" cannot be a nested field. Please specify a top-level field in the collection "${config.slug}"`,
    )
  }

  const useAsThumbnailField = config.flattenedFields.find((field) => {
    return fieldAffectsData(field) && field.name === config.admin?.useAsThumbnail
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
