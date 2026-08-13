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

  if ('id' in doc) {
    result.id = doc.id
  }

  for (const field of fields) {
    if (field.localized && doc[field.name] && typeof doc[field.name] === 'object') {
      if (locale in doc[field.name]) {
        result[field.name] = doc[field.name][locale]
      }
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
              const blockType = item.blockType

              // `blocks` holds either an inline block or a slug referencing `config.blocks`.
              const blockOrSlug = field.blocks.find((e) =>
                typeof e === 'string' ? e === blockType : e.slug === blockType,
              )

              const block: FlattenedBlock | undefined =
                typeof blockOrSlug === 'string'
                  ? config.blocks?.find((e) => e.slug === blockOrSlug)
                  : blockOrSlug

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
