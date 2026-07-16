import type { Block, Field, FlattenedBlock } from '../../fields/config/types.js'
import type { SanitizedConfig } from '../../index.js'
import type { JsonObject } from '../../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../../fields/config/types.js'

type ComparableValue =
  | { [key: string]: ComparableValue }
  | boolean
  | ComparableValue[]
  | null
  | number
  | string

type HasNonLocalizedDataChangedArgs = {
  after: JsonObject
  before: JsonObject
  configBlockReferences: SanitizedConfig['blocks']
  fields: Field[]
}

type NormalizeArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  data: JsonObject
  fields: Field[]
  parentIsLocalized?: boolean
}

export const hasNonLocalizedDataChanged = ({
  after,
  before,
  configBlockReferences,
  fields,
}: HasNonLocalizedDataChangedArgs): boolean => {
  const beforeSharedData = normalizeNonLocalizedData({
    configBlockReferences,
    data: before,
    fields,
  })
  const afterSharedData = normalizeNonLocalizedData({
    configBlockReferences,
    data: after,
    fields,
  })

  return stableStringify(beforeSharedData) !== stableStringify(afterSharedData)
}

const normalizeNonLocalizedData = ({
  configBlockReferences,
  data,
  fields,
  parentIsLocalized = false,
}: NormalizeArgs): Record<string, ComparableValue> => {
  const result: Record<string, ComparableValue> = {}

  for (const field of fields) {
    if (fieldAffectsData(field)) {
      if (!(field.name in data)) {
        continue
      }

      const fieldIsLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

      if (fieldIsLocalized) {
        continue
      }

      const value = data[field.name]

      switch (field.type) {
        case 'array': {
          result[field.name] = normalizeArrayRows({
            configBlockReferences,
            fields: field.fields,
            rows: Array.isArray(value) ? value : [],
          })
          break
        }

        case 'blocks': {
          result[field.name] = normalizeBlocks({
            blocks: Array.isArray(value) ? value : [],
            configBlockReferences,
            fieldBlocks: field.blocks,
          })
          break
        }

        case 'group': {
          result[field.name] = normalizeNonLocalizedData({
            configBlockReferences,
            data: isJsonObject(value) ? value : {},
            fields: field.fields,
            parentIsLocalized,
          })
          break
        }

        default: {
          result[field.name] = normalizeComparableValue(value)
          break
        }
      }
    } else if ('fields' in field && Array.isArray(field.fields)) {
      Object.assign(
        result,
        normalizeNonLocalizedData({
          configBlockReferences,
          data,
          fields: field.fields,
          parentIsLocalized,
        }),
      )
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const tabIsLocalized = fieldShouldBeLocalized({ field: tab, parentIsLocalized })

        if (tabHasName(tab)) {
          if (tabIsLocalized || !(tab.name in data)) {
            continue
          }

          const tabValue = data[tab.name]
          result[tab.name] = normalizeNonLocalizedData({
            configBlockReferences,
            data: isJsonObject(tabValue) ? tabValue : {},
            fields: tab.fields,
            parentIsLocalized,
          })
        } else {
          Object.assign(
            result,
            normalizeNonLocalizedData({
              configBlockReferences,
              data,
              fields: tab.fields,
              parentIsLocalized,
            }),
          )
        }
      }
    }
  }

  return result
}

const normalizeArrayRows = ({
  configBlockReferences,
  fields,
  rows,
}: {
  configBlockReferences: SanitizedConfig['blocks']
  fields: Field[]
  rows: unknown[]
}): ComparableValue[] => {
  return rows.map((row) => {
    const rowData = isJsonObject(row) ? row : {}

    return {
      id: normalizeComparableValue(rowData.id),
      ...normalizeNonLocalizedData({
        configBlockReferences,
        data: rowData,
        fields,
      }),
    }
  })
}

const normalizeBlocks = ({
  blocks,
  configBlockReferences,
  fieldBlocks,
}: {
  blocks: unknown[]
  configBlockReferences: SanitizedConfig['blocks']
  fieldBlocks: (Block | string)[]
}): ComparableValue[] => {
  return blocks.map((blockData) => {
    const blockObject = isJsonObject(blockData) ? blockData : {}
    const blockType = typeof blockObject.blockType === 'string' ? blockObject.blockType : undefined
    const blockOrSlug = fieldBlocks.find((block) => {
      const slug = typeof block === 'string' ? block : block.slug
      return slug === blockType
    })
    const block: Block | FlattenedBlock | undefined =
      typeof blockOrSlug === 'string'
        ? configBlockReferences?.find((blockRef) => blockRef.slug === blockOrSlug)
        : blockOrSlug

    return {
      id: normalizeComparableValue(blockObject.id),
      blockName: normalizeComparableValue(blockObject.blockName),
      blockType: normalizeComparableValue(blockObject.blockType),
      ...(block
        ? normalizeNonLocalizedData({
            configBlockReferences,
            data: blockObject,
            fields: block.fields,
          })
        : {}),
    }
  })
}

const isJsonObject = (value: unknown): value is JsonObject => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

const normalizeComparableValue = (value: unknown): ComparableValue => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeComparableValue(item))
  }

  if (value && typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    const result: Record<string, ComparableValue> = {}

    for (const key of Object.keys(objectValue).sort()) {
      const normalizedValue = normalizeComparableValue(objectValue[key])

      if (typeof normalizedValue !== 'undefined') {
        result[key] = normalizedValue
      }
    }

    return result
  }

  if (
    typeof value === 'boolean' ||
    typeof value === 'number' ||
    typeof value === 'string' ||
    value === null
  ) {
    return value
  }

  return null
}

const stableStringify = (value: ComparableValue | Record<string, ComparableValue>): string => {
  return JSON.stringify(value)
}
