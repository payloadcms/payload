import type { SanitizedConfig } from '../config/types.js'
import type { FlattenedBlock, FlattenedField } from '../fields/config/types.js'

export const unwrapLocalizedDoc = ({
  config,
  doc,
  fields,
  locale,
}: {
  config: SanitizedConfig
  doc: any
  fields: FlattenedField[]
  locale: string
}): any => {
  const result: any = {}

  for (const field of fields) {
    if (field.localized && doc[field.name] && typeof doc[field.name] === 'object') {
      result[field.name] = doc[field.name][locale]
      continue
    }

    if (field.type === 'group' || field.type === 'tab') {
      if (doc[field.name] && typeof doc[field.name] === 'object') {
        result[field.name] = unwrapLocalizedDoc({
          config,
          doc: doc[field.name],
          fields: field.flattenedFields,
          locale,
        })
      } else if (field.name in doc) {
        result[field.name] = doc[field.name]
      }

      continue
    }

    if (field.type === 'array' || field.type === 'blocks') {
      if (Array.isArray(doc[field.name])) {
        const fieldResult: any[] = []

        for (const item of doc[field.name]) {
          if (item && typeof item === 'object') {
            let fieldsToUse: FlattenedField[] | null = null

            if (field.type === 'array') {
              fieldsToUse = field.flattenedFields
            } else {
              let block: FlattenedBlock | undefined
              const blockType = item.blockType

              if (field.blockReferences) {
                const blockReference = field.blockReferences.find((e) =>
                  typeof e === 'string' ? e === blockType : e.slug === blockType,
                )

                if (blockReference) {
                  if (typeof blockReference === 'object') {
                    block = blockReference
                  } else {
                    block = config.blocks?.find((e) => e.slug === blockReference)
                  }
                }
              }

              if (!block) {
                block = field.blocks.find((e) => e.slug === blockType)
              }

              if (block) {
                fieldsToUse = block.flattenedFields
              }
            }

            if (fieldsToUse) {
              fieldResult.push(
                unwrapLocalizedDoc({
                  config,
                  doc: item,
                  fields: fieldsToUse,
                  locale,
                }),
              )
            } else {
              fieldResult.push(item)
            }
          }
        }

        result[field.name] = fieldResult
      } else if (field.name in doc) {
        result[field.name] = doc[field.name]
      }

      continue
    }

    if (field.name in doc) {
      result[field.name] = doc[field.name]
    }
  }

  return result
}
