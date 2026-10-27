import { isDeepStrictEqual } from 'node:util'

import type { SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Field, TabAsField } from '../fields/config/types.js'
import type { SanitizedGlobalConfig } from '../globals/config/types.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { fieldAffectsData, tabHasName } from '../fields/config/types.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  data: JsonObject
  doc: JsonObject
  global: null | SanitizedGlobalConfig
  id?: number | string
  operation: 'create' | 'update'
  req: PayloadRequest
}

type TraverseArgs = {
  blockData?: JsonObject
  currentSiblingData: JsonObject
  fields: (Field | TabAsField)[]
  proposedSiblingData: JsonObject
} & Args

/**
 * Checks whether a proposed merge changes any field the merging user cannot write.
 *
 * This deliberately evaluates only field access functions. Running the normal field
 * pipeline would also run mutation hooks, defaults and validation during a dry run.
 */
export const checkFieldAccess = async ({
  id,
  collection,
  data,
  doc,
  global,
  operation,
  req,
}: Args): Promise<boolean> =>
  traverseFields({
    id,
    collection,
    currentSiblingData: doc,
    data,
    doc,
    fields: (collection?.fields ?? global?.fields) as (Field | TabAsField)[],
    global,
    operation,
    proposedSiblingData: data,
    req,
  })

const traverseFields = async ({
  id,
  blockData,
  collection,
  currentSiblingData,
  data,
  doc,
  fields,
  global,
  operation,
  proposedSiblingData,
  req,
}: TraverseArgs): Promise<boolean> => {
  for (const field of fields) {
    if (fieldAffectsData(field) && field.name) {
      const fieldName = field.name
      const hasProposedValue = Object.prototype.hasOwnProperty.call(proposedSiblingData, fieldName)
      const proposedValue = proposedSiblingData[fieldName]
      const currentValue = currentSiblingData[fieldName]
      const access = field.access?.[operation]

      if (hasProposedValue && access && !isDeepStrictEqual(proposedValue, currentValue)) {
        const hasAccess = await access(
          collection
            ? {
                id,
                blockData,
                collection,
                data,
                doc,
                req,
                siblingData: proposedSiblingData,
              }
            : {
                id,
                blockData,
                data,
                doc,
                global: global!,
                req,
                siblingData: proposedSiblingData,
              },
        )

        if (!hasAccess) {
          return false
        }
      }
    }

    switch (field.type) {
      case 'array': {
        const proposedRows = proposedSiblingData[field.name]
        const currentRows = currentSiblingData[field.name]

        if (!Array.isArray(proposedRows)) {
          break
        }

        for (const proposedRow of proposedRows) {
          if (!isJsonObject(proposedRow)) {
            continue
          }

          const currentRow = findCurrentRow({ currentRows, proposedRow })
          const hasAccess = await traverseFields({
            id,
            collection,
            currentSiblingData: currentRow,
            data,
            doc,
            fields: field.fields,
            global,
            operation,
            proposedSiblingData: proposedRow,
            req,
          })

          if (!hasAccess) {
            return false
          }
        }

        break
      }

      case 'blocks': {
        const proposedRows = proposedSiblingData[field.name]
        const currentRows = currentSiblingData[field.name]

        if (!Array.isArray(proposedRows)) {
          break
        }

        for (const proposedRow of proposedRows) {
          if (!isJsonObject(proposedRow)) {
            continue
          }

          const currentRow = findCurrentRow({ currentRows, proposedRow })
          const blockType = proposedRow.blockType ?? currentRow.blockType
          const block = field.blocks
            .map((each) => (typeof each === 'string' ? req.payload.blocks[each] : each))
            .find((each) => each?.slug === blockType)

          if (!block) {
            continue
          }

          const hasAccess = await traverseFields({
            id,
            blockData: proposedRow,
            collection,
            currentSiblingData: currentRow,
            data,
            doc,
            fields: block.fields,
            global,
            operation,
            proposedSiblingData: proposedRow,
            req,
          })

          if (!hasAccess) {
            return false
          }
        }

        break
      }

      case 'collapsible':
      case 'row': {
        const hasAccess = await traverseFields({
          id,
          blockData,
          collection,
          currentSiblingData,
          data,
          doc,
          fields: field.fields,
          global,
          operation,
          proposedSiblingData,
          req,
        })

        if (!hasAccess) {
          return false
        }

        break
      }

      case 'group': {
        const proposedGroup = fieldAffectsData(field)
          ? proposedSiblingData[field.name]
          : proposedSiblingData
        const currentGroup = fieldAffectsData(field)
          ? currentSiblingData[field.name]
          : currentSiblingData

        if (!isJsonObject(proposedGroup)) {
          break
        }

        const hasAccess = await traverseFields({
          id,
          blockData,
          collection,
          currentSiblingData: isJsonObject(currentGroup) ? currentGroup : {},
          data,
          doc,
          fields: field.fields,
          global,
          operation,
          proposedSiblingData: proposedGroup,
          req,
        })

        if (!hasAccess) {
          return false
        }

        break
      }

      case 'tab': {
        const proposedTab = tabHasName(field)
          ? proposedSiblingData[field.name]
          : proposedSiblingData
        const currentTab = tabHasName(field) ? currentSiblingData[field.name] : currentSiblingData

        if (!isJsonObject(proposedTab)) {
          break
        }

        const hasAccess = await traverseFields({
          id,
          blockData,
          collection,
          currentSiblingData: isJsonObject(currentTab) ? currentTab : {},
          data,
          doc,
          fields: field.fields,
          global,
          operation,
          proposedSiblingData: proposedTab,
          req,
        })

        if (!hasAccess) {
          return false
        }

        break
      }

      case 'tabs': {
        const hasAccess = await traverseFields({
          id,
          blockData,
          collection,
          currentSiblingData,
          data,
          doc,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          global,
          operation,
          proposedSiblingData,
          req,
        })

        if (!hasAccess) {
          return false
        }

        break
      }

      default:
        break
    }
  }

  return true
}

const findCurrentRow = ({
  currentRows,
  proposedRow,
}: {
  currentRows: unknown
  proposedRow: JsonObject
}): JsonObject => {
  if (!Array.isArray(currentRows)) {
    return {}
  }

  if (proposedRow.id !== undefined) {
    const matchingRow = currentRows.find(
      (row) => isJsonObject(row) && String(row.id) === String(proposedRow.id),
    )

    if (isJsonObject(matchingRow)) {
      return matchingRow
    }
  }

  return {}
}

const isJsonObject = (value: unknown): value is JsonObject =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
