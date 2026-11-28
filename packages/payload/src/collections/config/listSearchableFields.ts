import type { CollectionConfig } from '../../index.js'

import { InvalidConfiguration } from '../../errors/InvalidConfiguration.js'
import { fieldAffectsData } from '../../fields/config/types.js'
import { flattenTopLevelFields } from '../../utilities/flattenTopLevelFields.js'

/**
 * Validate listSearchableFields for collections.
 *
 * Previously, specifying a field name in `admin.listSearchableFields` that does not
 * exist on the collection would not throw until the field was actually queried
 * (e.g. when searching in the List View), and the resulting error was only
 * ever surfaced in production builds - in development it silently failed to
 * error at all. Validating eagerly here, at config sanitization time, ensures a
 * clear, actionable error is thrown consistently in every environment.
 */
export const validateListSearchableFields = (config: CollectionConfig) => {
  if (!config.admin?.listSearchableFields?.length) {
    return
  }

  const fields = flattenTopLevelFields(config.fields)

  for (const fieldName of config.admin.listSearchableFields) {
    if (fieldName === 'id') {
      continue
    }

    // Only validate the top-level segment of the path - relationship/join
    // paths such as `category.title` are resolved deeper in the query and
    // are not flattened top-level fields of this collection.
    const topLevelFieldName = fieldName.split('.')[0]

    const searchableField = fields.find((field) => {
      if (fieldAffectsData(field)) {
        return field.name === topLevelFieldName
      }
      return false
    })

    if (!searchableField) {
      throw new InvalidConfiguration(
        `The field "${fieldName}" specified in "admin.listSearchableFields" does not exist in the collection "${config.slug}"`,
      )
    }
  }
}
