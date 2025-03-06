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
