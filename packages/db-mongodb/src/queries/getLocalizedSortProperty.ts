import type { FlattenedField, SanitizedConfig } from 'payload'

import { fieldAffectsData } from 'payload/shared'

type Args = {
  config: SanitizedConfig
  fields: FlattenedField[]
  locale: string
  result?: string
  segments: string[]
}

export const getLocalizedSortProperty = ({
  config,
  fields,
  locale,
  result: incomingResult,
  segments: incomingSegments,
}: Args): string => {
  // If localization is not enabled, accept exactly
  // what is sent in
  if (!config.localization) {
    return incomingSegments.join('.')
  }

  const segments = [...incomingSegments]

  // Retrieve first segment, and remove from segments
  const firstSegment = segments.shift()

  // Attempt to find a matched field
  const matchedField = fields.find(
    (field) => fieldAffectsData(field) && field.name === firstSegment,
  )

  if (matchedField) {
    let nextFields: FlattenedField[]
    const remainingSegments = [...segments]
    let localizedSegment = matchedField.name

    if (matchedField.localized) {
      // Check to see if next segment is a locale
      if (segments.length > 0) {
        const nextSegmentIsLocale = config.localization.localeCodes.includes(remainingSegments[0])

        // If next segment is locale, remove it from remaining segments
        // and use it to localize the current segment
        if (nextSegmentIsLocale) {
          const nextSegment = remainingSegments.shift()
          localizedSegment = `${matchedField.name}.${nextSegment}`
        }
      } else {
        // If no more segments, but field is localized, use default locale
        localizedSegment = `${matchedField.name}.${locale}`
      }
    }

    // If there are subfields, pass them through
    if (
      matchedField.type === 'tab' ||
      matchedField.type === 'group' ||
      matchedField.type === 'array'
    ) {
      nextFields = matchedField.flattenedFields
    }

    if (matchedField.type === 'blocks') {
      nextFields = matchedField.blocks.reduce((flattenedBlockFields, block) => {
        return [
          ...flattenedBlockFields,
          ...block.flattenedFields.filter(
            (blockField) =>
              (fieldAffectsData(blockField) &&
                blockField.name !== 'blockType' &&
                blockField.name !== 'blockName') ||
              !fieldAffectsData(blockField),
          ),
        ]
      }, [])
    }

    const result = incomingResult ? `${incomingResult}.${localizedSegment}` : localizedSegment

    if (nextFields) {
      return getLocalizedSortProperty({
        config,
        fields: nextFields,
        locale,
        result,
        segments: remainingSegments,
      })
    }

    return result
  }

  return incomingSegments.join('.')
}
