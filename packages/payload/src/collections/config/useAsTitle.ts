import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'

/**
 * Validate useAsTitle for collections.
 */
export const validateUseAsTitle = (config: CollectionConfig) => {
  if (config.admin.useAsTitle.includes('.')) {
    throw new InvalidConfiguration(
      `"useAsTitle" cannot be a nested field. Please specify a top-level field in the collection "${config.slug}"`,
    )
  }

  if (config?.admin && config.admin?.useAsTitle && config.admin.useAsTitle !== 'id') {
    // If auth is enabled then we don't need to
    if (config.auth) {
      if (config.admin.useAsTitle !== 'email') {
        if (
          !config.fields.find((field) => {
            if ('name' in field && config.admin) {
              return field.name === config.admin.useAsTitle
            }
            return false
          })
        ) {
          throw new InvalidConfiguration(
            `The field "${config.admin.useAsTitle}" specified in "admin.useAsTitle" does not exist in the collection "${config.slug}"`,
          )
        }
      }
    } else {
      if (
        !config.fields.find((field) => {
          if ('name' in field && config.admin) {
            return field.name === config.admin.useAsTitle
          }
          return false
        })
      ) {
        throw new InvalidConfiguration(
          `The field "${config.admin.useAsTitle}" specified in "admin.useAsTitle" does not exist in the collection "${config.slug}"`,
        )
      }
    }
  }
}
