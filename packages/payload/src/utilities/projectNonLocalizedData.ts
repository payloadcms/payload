import type { Block, Field, FlattenedBlock } from '../fields/config/types.js'
import type { SanitizedConfig } from '../index.js'
import type { JsonObject } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized, tabHasName } from '../fields/config/types.js'
import { deepCopyObjectSimple } from './deepCopyObject.js'

type ProjectNonLocalizedDataArgs = {
  configBlockReferences: SanitizedConfig['blocks']
  data: JsonObject
  fields: Field[]
}

export function projectNonLocalizedData({
  configBlockReferences,
  data,
  fields,
}: ProjectNonLocalizedDataArgs): JsonObject {
  const projectedData = deepCopyObjectSimple(data)

  removeLocalizedData({
    configBlockReferences,
    data: projectedData,
    fields,
    parentIsLocalized: false,
  })

  return projectedData
}

type RemoveLocalizedDataArgs = {
  parentIsLocalized: boolean
} & ProjectNonLocalizedDataArgs

function removeLocalizedData({
  configBlockReferences,
  data,
  fields,
  parentIsLocalized,
}: RemoveLocalizedDataArgs): void {
  for (const field of fields) {
    if (fieldAffectsData(field)) {
      if (parentIsLocalized || fieldShouldBeLocalized({ field, parentIsLocalized })) {
        delete data[field.name]
        continue
      }

      const fieldValue = data[field.name]

      switch (field.type) {
        case 'array': {
          if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (isObject(row)) {
                removeLocalizedData({
                  configBlockReferences,
                  data: row,
                  fields: field.fields,
                  parentIsLocalized: false,
                })
              }
            }
          }
          break
        }

        case 'blocks': {
          if (Array.isArray(fieldValue)) {
            for (const row of fieldValue) {
              if (!isObject(row)) {
                continue
              }

              const blockOrSlug = field.blocks.find((block) => {
                const slug = typeof block === 'string' ? block : block.slug
                return slug === row.blockType
              })
              const block: Block | FlattenedBlock | undefined =
                typeof blockOrSlug === 'string'
                  ? configBlockReferences?.find(({ slug }) => slug === blockOrSlug)
                  : blockOrSlug

              if (block) {
                removeLocalizedData({
                  configBlockReferences,
                  data: row,
                  fields: block.fields,
                  parentIsLocalized: false,
                })
              }
            }
          }
          break
        }

        case 'group': {
          if (isObject(fieldValue)) {
            removeLocalizedData({
              configBlockReferences,
              data: fieldValue,
              fields: field.fields,
              parentIsLocalized: false,
            })
          }
          break
        }
      }
    } else {
      switch (field.type) {
        case 'collapsible':
        case 'group':
        case 'row': {
          removeLocalizedData({
            configBlockReferences,
            data,
            fields: field.fields,
            parentIsLocalized,
          })
          break
        }

        case 'tabs': {
          for (const tab of field.tabs) {
            if (tabHasName(tab)) {
              if (parentIsLocalized || fieldShouldBeLocalized({ field: tab, parentIsLocalized })) {
                delete data[tab.name]
              } else if (isObject(data[tab.name])) {
                removeLocalizedData({
                  configBlockReferences,
                  data: data[tab.name],
                  fields: tab.fields,
                  parentIsLocalized: false,
                })
              }
            } else {
              removeLocalizedData({
                configBlockReferences,
                data,
                fields: tab.fields,
                parentIsLocalized,
              })
            }
          }
          break
        }
      }
    }
  }
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
