import type {
  Block,
  Field,
  FlattenedBlock,
  FlattenedBlocksField,
  FlattenedField,
  FlattenedJoinField,
} from '../fields/config/types.js'

import { fieldAffectsData, tabHasName } from '../fields/config/types.js'

export const flattenBlock = ({ block }: { block: Block }): FlattenedBlock => {
  return {
    ...block,
    flattenedFields: flattenAllFields({ fields: block.fields }),
  }
}

const flattenedFieldsCache = new Map<Field[], FlattenedField[]>()

/**
 * Flattens all fields in a collection, preserving the nested field structure.
 * @param cache
 * @param fields
 */
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

  return flattenFields({ fields, hasConditionalParent: false })
}

const flattenFields = ({
  fields,
  hasConditionalParent,
}: {
  fields: Field[]
  hasConditionalParent: boolean
}): FlattenedField[] => {
  const result: FlattenedField[] = []

  for (const field of fields) {
    switch (field.type) {
      case 'array':
      case 'group': {
        if (fieldAffectsData(field)) {
          result.push(
            withConditionalParent({
              field: {
                ...field,
                flattenedFields: flattenFields({
                  fields: field.fields,
                  hasConditionalParent: false,
                }),
              },
              hasConditionalParent,
            }),
          )
        } else {
          for (const nestedField of flattenFields({
            fields: field.fields,
            hasConditionalParent: hasConditionalParent || Boolean(field.admin?.condition),
          })) {
            result.push(nestedField)
          }
        }
        break
      }

      case 'blocks': {
        const blocks: (FlattenedBlock | string)[] = []
        for (const block of field.blocks) {
          if (typeof block === 'string') {
            blocks.push(block)
            continue
          }
          blocks.push(flattenBlock({ block }))
        }

        const resultField: FlattenedBlocksField = {
          ...field,
          blocks,
        }

        result.push(withConditionalParent({ field: resultField, hasConditionalParent }))
        break
      }

      case 'collapsible':
      case 'row': {
        for (const nestedField of flattenFields({
          fields: field.fields,
          hasConditionalParent: hasConditionalParent || Boolean(field.admin?.condition),
        })) {
          result.push(nestedField)
        }
        break
      }

      case 'join': {
        result.push(
          withConditionalParent({ field: field as FlattenedJoinField, hasConditionalParent }),
        )
        break
      }

      case 'tabs': {
        const tabsHaveConditionalParent = hasConditionalParent || Boolean(field.admin?.condition)

        for (const tab of field.tabs) {
          if (!tabHasName(tab)) {
            for (const nestedField of flattenFields({
              fields: tab.fields,
              hasConditionalParent: tabsHaveConditionalParent || Boolean(tab.admin?.condition),
            })) {
              result.push(nestedField)
            }
          } else {
            result.push(
              withConditionalParent({
                field: {
                  ...tab,
                  type: 'tab',
                  flattenedFields: flattenFields({
                    fields: tab.fields,
                    hasConditionalParent: false,
                  }),
                },
                hasConditionalParent: tabsHaveConditionalParent,
              }),
            )
          }
        }
        break
      }

      default: {
        if (field.type !== 'ui') {
          result.push(withConditionalParent({ field, hasConditionalParent }))
        }
      }
    }
  }

  if (!hasConditionalParent) {
    flattenedFieldsCache.set(fields, result)
  }

  return result
}

const withConditionalParent = <T extends FlattenedField>({
  field,
  hasConditionalParent,
}: {
  field: T
  hasConditionalParent: boolean
}): T => {
  if (hasConditionalParent) {
    return { ...field, hasConditionalParent }
  }

  return field
}
