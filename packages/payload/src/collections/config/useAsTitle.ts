import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { flattenTopLevelFields } from '../../utilities/flattenTopLevelFields.js'

/**
 * Validate useAsTitle for collections.
 */
export const validateUseAsTitle = (config: CollectionConfig) => {
  if (config.admin?.useAsTitle?.includes('.')) {
    throw new InvalidConfiguration(
      `"useAsTitle" cannot be a nested field. Please specify a top-level field in the collection "${config.slug}"`,
    )
  }

  if (config?.admin && config.admin?.useAsTitle && config.admin.useAsTitle !== 'id') {
    const fields = flattenTopLevelFields(config.fields)
    const useAsTitleField = fields.find((field) => {
      if (fieldAffectsData(field) && config.admin) {
        return field.name === config.admin.useAsTitle
      }
      return false
    })

    // If auth is enabled then we don't need to
    if (config.auth) {
      if (config.admin.useAsTitle !== 'email') {
        if (!useAsTitleField) {
          throw new InvalidConfiguration(
            `The field "${config.admin.useAsTitle}" specified in "admin.useAsTitle" does not exist in the collection "${config.slug}"`,
          )
        }
      }
    } else {
      if (useAsTitleField && 'virtual' in useAsTitleField && useAsTitleField.virtual === true) {
        // Virtual fields are allowed as useAsTitle when they are hierarchy path fields
        // (set automatically by hierarchy's usePathAsTitle option).
        // Detect this by checking if the collection has hierarchy and the field matches the titlePathFieldName.
        const isHierarchyPathField =
          config.hierarchy !== false &&
          config.hierarchy &&
          typeof config.hierarchy === 'object' &&
          'titlePathFieldName' in config.hierarchy &&
          (config.hierarchy as { titlePathFieldName: string }).titlePathFieldName ===
            config.admin?.useAsTitle

        if (!isHierarchyPathField) {
          throw new InvalidConfiguration(
            `The field "${config.admin.useAsTitle}" specified in "admin.useAsTitle" in the collection "${config.slug}" is virtual. A virtual field can be used as the title only when linked to a relationship field.`,
          )
        }
      }
      if (!useAsTitleField) {
        throw new InvalidConfiguration(
          `The field "${config.admin.useAsTitle}" specified in "admin.useAsTitle" does not exist in the collection "${config.slug}"`,
        )
      }
    }
  }
}
