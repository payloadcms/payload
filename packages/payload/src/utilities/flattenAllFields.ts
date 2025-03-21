import type {
  Block,
  Field,
  FlattenedBlock,
  FlattenedBlocksField,
  FlattenedField,
  FlattenedJoinField,
} from '../fields/config/types.js'

import { tabHasName } from '../fields/config/types.js'

export const flattenBlock = ({ block }: { block: Block }): FlattenedBlock => {
  return {
    ...block,
    flattenedFields: flattenAllFields({ fields: block.fields }),
  }
}

/**
 * Like flattenAllFields, but instead of creating a `flattenedFields` key, it puts all the fields in the top-level array.
 */
export const flattenAllFields2 = (fields: Field[]): Field[] => {
  const result: Field[] = []

  for (const field of fields) {
    // Add the current field if it's not a structural field
    if (field.type !== 'row' && field.type !== 'collapsible') {
      result.push(field)
    }

    // Process subfields for various container types
    if (
      field.type === 'group' ||
      field.type === 'array' ||
      field.type === 'collapsible' ||
      field.type === 'row'
    ) {
      if ('fields' in field && Array.isArray(field.fields)) {
        result.push(...flattenAllFields2(field.fields))
      }
    } else if (field.type === 'tabs' && 'tabs' in field) {
      field.tabs.forEach((tab) => {
        if ('fields' in tab && Array.isArray(tab.fields)) {
          result.push(...flattenAllFields2(tab.fields))
        }
      })
    } else if (field.type === 'blocks' && 'blocks' in field) {
      field.blocks.forEach((block) => {
        if (typeof block !== 'string' && 'fields' in block && Array.isArray(block.fields)) {
          result.push(...flattenAllFields2(block.fields))
        }
      })
    }
  }

  return result
}

const flattenedFieldsCache = new Map<Field[], FlattenedField[]>()

export const flattenAllFields = ({
  cache,
  fields,
}: {
  /** Allows you to get FlattenedField[] from Field[] anywhere without performance overhead by caching. */
  cache?: boolean
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
        result.push({ ...field, flattenedFields: flattenAllFields({ fields: field.fields }) })
        break
      }

      case 'blocks': {
        const blocks: FlattenedBlock[] = []
        let blockReferences: (FlattenedBlock | string)[] | undefined = undefined
        if (field.blockReferences) {
          blockReferences = []
          for (const block of field.blockReferences) {
            if (typeof block === 'string') {
              blockReferences.push(block)
              continue
            }
            blockReferences.push(flattenBlock({ block }))
          }
        } else {
          for (const block of field.blocks) {
            if (typeof block === 'string') {
              blocks.push(block)
              continue
            }
            blocks.push(flattenBlock({ block }))
          }
        }

        const resultField: FlattenedBlocksField = {
          ...field,
          blockReferences,
          blocks,
        }

        result.push(resultField)
        break
      }

      case 'collapsible':
      case 'row': {
        for (const nestedField of flattenAllFields({ fields: field.fields })) {
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
            for (const nestedField of flattenAllFields({ fields: tab.fields })) {
              result.push(nestedField)
            }
          } else {
            result.push({
              ...tab,
              type: 'tab',
              flattenedFields: flattenAllFields({ fields: tab.fields }),
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
