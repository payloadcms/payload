import type { Field } from '../../fields/config/types.js'
import type { SanitizedConfig } from '../../index.js'
import type { JsonObject } from '../../types/index.js'

import { fieldAffectsData, fieldIsVirtual, tabHasName } from '../../fields/config/types.js'

type HasNonLocalizedDataChangedArgs = {
  after: JsonObject
  before: JsonObject
  configBlockReferences: SanitizedConfig['blocks']
  fields: Field[]
}

export const hasNonLocalizedDataChanged = ({
  after,
  before,
  configBlockReferences,
  fields,
}: HasNonLocalizedDataChangedArgs): boolean => {
  for (const field of fields) {
    // Skipping localized containers also skips their implicitly localized children.
    if (fieldIsVirtual(field) || ('localized' in field && field.localized)) {
      continue
    }

    if (fieldAffectsData(field)) {
      const beforeValue = before[field.name]
      const afterValue = after[field.name]

      switch (field.type) {
        case 'array':
        case 'blocks': {
          if (
            hasRowDataChanged({
              after: afterValue,
              before: beforeValue,
              configBlockReferences,
              field,
            })
          ) {
            return true
          }
          break
        }

        case 'group': {
          if (
            hasNonLocalizedDataChanged({
              after: asObject({ value: afterValue }),
              before: asObject({ value: beforeValue }),
              configBlockReferences,
              fields: field.fields,
            })
          ) {
            return true
          }
          break
        }

        default: {
          if (!areValuesEqual({ after: afterValue, before: beforeValue })) {
            return true
          }
        }
      }
    } else if ('fields' in field) {
      if (
        hasNonLocalizedDataChanged({ after, before, configBlockReferences, fields: field.fields })
      ) {
        return true
      }
    } else if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        if (fieldIsVirtual(tab) || ('localized' in tab && tab.localized)) {
          continue
        }

        if (
          hasNonLocalizedDataChanged({
            after: tabHasName(tab) ? asObject({ value: after[tab.name] }) : after,
            before: tabHasName(tab) ? asObject({ value: before[tab.name] }) : before,
            configBlockReferences,
            fields: tab.fields,
          })
        ) {
          return true
        }
      }
    }
  }

  return false
}

const hasRowDataChanged = ({
  after,
  before,
  configBlockReferences,
  field,
}: {
  after: unknown
  before: unknown
  configBlockReferences: SanitizedConfig['blocks']
  field: Extract<Field, { type: 'array' | 'blocks' }>
}): boolean => {
  const beforeRows = definedItems({ value: before })
  const afterRows = definedItems({ value: after })

  if (beforeRows.length !== afterRows.length) {
    return true
  }

  return beforeRows.some((row, index) => {
    const beforeRow = asObject({ value: row })
    const afterRow = asObject({ value: afterRows[index] })

    if (!areValuesEqual({ after: afterRow.id ?? null, before: beforeRow.id ?? null })) {
      return true
    }

    let fields: Field[]

    if (field.type === 'blocks') {
      if (
        !areValuesEqual({
          after: afterRow.blockType ?? null,
          before: beforeRow.blockType ?? null,
        }) ||
        !areValuesEqual({ after: afterRow.blockName ?? null, before: beforeRow.blockName ?? null })
      ) {
        return true
      }

      const blockOrSlug = field.blocks.find(
        (block) => (typeof block === 'string' ? block : block.slug) === afterRow.blockType,
      )
      const block =
        typeof blockOrSlug === 'string'
          ? configBlockReferences?.find((block) => block.slug === blockOrSlug)
          : blockOrSlug

      fields = block?.fields ?? []
    } else {
      fields = field.fields
    }

    return hasNonLocalizedDataChanged({
      after: afterRow,
      before: beforeRow,
      configBlockReferences,
      // Metadata was compared above, including its missing/null equivalence.
      fields: fields.filter(
        (child) =>
          !fieldAffectsData(child) ||
          (child.name !== 'id' && (field.type !== 'blocks' || child.name !== 'blockName')),
      ),
    })
  })
}

const asObject = ({ value }: { value: unknown }): JsonObject =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : {}

const definedItems = ({ value }: { value: unknown }): unknown[] =>
  Array.isArray(value) ? value.filter((item) => typeof item !== 'undefined') : []

const areValuesEqual = ({ after, before }: { after: unknown; before: unknown }): boolean => {
  if (before === after) {
    return true
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const beforeItems = definedItems({ value: before })
    const afterItems = definedItems({ value: after })

    return (
      beforeItems.length === afterItems.length &&
      beforeItems.every((item, index) => areValuesEqual({ after: afterItems[index], before: item }))
    )
  }

  if (before && after && typeof before === 'object' && typeof after === 'object') {
    if (Array.isArray(before) || Array.isArray(after)) {
      return false
    }

    const beforeObject = before as JsonObject
    const afterObject = after as JsonObject
    const beforeKeys = Object.keys(beforeObject).filter((key) => beforeObject[key] !== undefined)
    const afterKeys = Object.keys(afterObject).filter((key) => afterObject[key] !== undefined)

    return (
      beforeKeys.length === afterKeys.length &&
      beforeKeys.every((key) =>
        areValuesEqual({ after: afterObject[key], before: beforeObject[key] }),
      )
    )
  }

  return false
}
