import type { SanitizedConfig } from '../config/types.js'
import type {
  Field,
  FlattenedBlock,
  FlattenedBlocksField,
  FlattenedField,
  FlattenedJoinField,
} from '../fields/config/types.js'

import { fieldAffectsData, tabHasName } from '../fields/config/types.js'

export const flattenBlock = ({
  block,
  config,
}: {
  block: { [key: string]: unknown; fields: Field[]; slug: string }
  config: SanitizedConfig
}): FlattenedBlock => {
  return {
    ...block,
    flattenedFields: flattenAllFields({ config, fields: block.fields }),
  } as FlattenedBlock
}

const flattenedFieldsCache = new Map<Field[], FlattenedField[]>()

/**
 * Flattens all fields in a collection, preserving the nested field structure.
 * @param cache
 * @param config
 * @param fields
 */
export const flattenAllFields = ({
  cache,
  config,
  fields,
}: {
  /** Allows you to get FlattenedField[] from Field[] anywhere without performance overhead by caching. */
  cache?: boolean
  config: SanitizedConfig
  fields: Field[]
}): FlattenedField[] => {
  if (cache) {
    const maybeFields = flattenedFieldsCache.get(fields)
    if (maybeFields) {
      return maybeFields
    }
  }

  const result: FlattenedField[] = []

  for (const field of fields) {
    switch (field.type) {
      case 'array':
      case 'group': {
        if (fieldAffectsData(field)) {
          result.push({
            ...field,
            flattenedFields: flattenAllFields({ config, fields: field.fields }),
          })
        } else {
          for (const nestedField of flattenAllFields({ config, fields: field.fields })) {
            result.push(nestedField)
          }
        }
        break
      }

      case 'blocks': {
        const blocks: FlattenedBlock[] = []
        for (const entry of field.blocks) {
          if (typeof entry !== 'string') {
            throw new Error(
              `flattenAllFields: expected block slug string in field "${field.name}", got ${typeof entry}`,
            )
          }
          const registeredBlock = config.blocks?.find((b) => b.slug === entry)
          if (!registeredBlock) {
            throw new Error(
              `flattenAllFields: block "${entry}" referenced by field "${field.name}" is not registered in config.blocks`,
            )
          }
          blocks.push(registeredBlock)
        }

        const resultField: FlattenedBlocksField = {
          ...field,
          blocks,
        }

        result.push(resultField)
        break
      }

      case 'collapsible':
      case 'row': {
        for (const nestedField of flattenAllFields({ config, fields: field.fields })) {
          result.push(nestedField)
        }
        break
      }

      case 'join': {
        result.push(field as FlattenedJoinField)
        break
      }

      case 'tabs': {
        for (const tab of field.tabs) {
          if (!tabHasName(tab)) {
            for (const nestedField of flattenAllFields({ config, fields: tab.fields })) {
              result.push(nestedField)
            }
          } else {
            result.push({
              ...tab,
              type: 'tab',
              flattenedFields: flattenAllFields({ config, fields: tab.fields }),
            })
          }
        }
        break
      }

      default: {
        if (field.type !== 'ui') {
          result.push(field)
        }
      }
    }
  }

  flattenedFieldsCache.set(fields, result)

  return result
}
