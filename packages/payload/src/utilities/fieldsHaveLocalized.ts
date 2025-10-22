import type { FlattenedBlock, FlattenedField, SanitizedConfig } from '../index.js'

export const fieldsHaveLocalized = ({
  config,
  fields,
}: {
  config: SanitizedConfig
  fields: FlattenedField[]
}) => {
  for (const field of fields) {
    if (config.localization && field.localized) {
      return true
    }

    if ('flattenedFields' in field) {
      if (fieldsHaveLocalized({ config, fields: field.flattenedFields })) {
        return true
      }
    }

    if ('blocks' in field) {
      for (const block of field.blocks) {
        if (fieldsHaveLocalized({ config, fields: block.flattenedFields })) {
          return true
        }
      }
    }

    if ('blockReferences' in field && field.blockReferences) {
      for (const blockReference of field.blockReferences) {
        let block: FlattenedBlock | null = null
        if (typeof blockReference === 'string') {
          block = config.blocks?.find((each) => each.slug === blockReference) ?? null
        } else {
          block = blockReference
        }

        if (block && fieldsHaveLocalized({ config, fields: block.flattenedFields })) {
          return true
        }
      }
    }
  }
}
