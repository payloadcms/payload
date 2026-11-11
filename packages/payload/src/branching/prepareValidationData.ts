import type { Field } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'

/**
 * Project only the values ordinary updates validate into the schema precheck. The original
 * candidate remains intact for replacement validators and the eventual main write.
 */
export const prepareValidationData = ({
  blockData,
  data,
  fields,
  parentIsLocalized = false,
  path = [],
  projection,
  req,
  shouldSkipParentValidation = false,
  siblingData = data,
}: {
  blockData?: Record<string, unknown>
  data: Record<string, unknown>
  fields: Field[]
  parentIsLocalized?: boolean
  path?: string[]
  projection?: Record<string, unknown>
  req: PayloadRequest
  shouldSkipParentValidation?: boolean
  siblingData?: Record<string, unknown>
}): Record<string, unknown> => {
  let validationData = { ...(projection ?? siblingData) }
  const localization = req.payload.config.localization
  const locale = req.locale || (localization ? localization.defaultLocale : 'en')

  for (const field of fields) {
    const fieldPath = fieldAffectsData(field) ? [...path, field.name] : path
    const shouldSkipValidation =
      shouldSkipParentValidation ||
      (field.admin?.condition &&
        !field.admin.condition(data, siblingData, {
          blockData: blockData!,
          operation: 'update',
          path: fieldPath,
          user: req.user,
        }))
    const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })
    const prepareChildren = ({
      childBlockData = blockData,
      childFields,
      childIsLocalized = parentIsLocalized || isLocalized,
      childPath = fieldPath,
      childProjection,
      childSiblingData = siblingData,
    }: {
      childBlockData?: Record<string, unknown>
      childFields: Field[]
      childIsLocalized?: boolean
      childPath?: string[]
      childProjection?: Record<string, unknown>
      childSiblingData?: Record<string, unknown>
    }) =>
      prepareValidationData({
        blockData: childBlockData,
        data,
        fields: childFields,
        parentIsLocalized: childIsLocalized,
        path: childPath,
        projection: childProjection,
        req,
        shouldSkipParentValidation: Boolean(shouldSkipValidation),
        siblingData: childSiblingData,
      })

    if (field.type === 'tabs') {
      validationData = prepareChildren({
        childFields: field.tabs.map((tab) => ({ ...tab, type: 'group' })),
        childProjection: validationData,
      })
      continue
    }

    if (!fieldAffectsData(field)) {
      if ('fields' in field) {
        validationData = prepareChildren({
          childFields: field.fields,
          childProjection: validationData,
        })
      }
      continue
    }

    const value = siblingData[field.name]
    const isLocalizedFallback =
      localization &&
      locale !== localization.defaultLocale &&
      isLocalized &&
      (field.type === 'array' || field.type === 'blocks') &&
      value === null

    if (shouldSkipValidation || isLocalizedFallback) {
      delete validationData[field.name]
      continue
    }

    if (field.type === 'group' && isRecord(value)) {
      validationData[field.name] = prepareChildren({
        childFields: field.fields,
        childSiblingData: value,
      })
    } else if ((field.type === 'array' || field.type === 'blocks') && Array.isArray(value)) {
      validationData[field.name] = value.map((row, index) => {
        if (!isRecord(row)) {
          return row
        }

        const block =
          field.type === 'blocks'
            ? field.blocks.find((block) =>
                typeof block === 'string' ? block === row.blockType : block.slug === row.blockType,
              )
            : undefined
        const resolvedBlock = typeof block === 'string' ? req.payload.blocks[block] : block
        const childFields = field.type === 'array' ? field.fields : resolvedBlock?.fields

        return childFields
          ? prepareChildren({
              childBlockData: field.type === 'blocks' ? row : blockData,
              childFields,
              childPath: [...fieldPath, String(index)],
              childSiblingData: row,
            })
          : row
      })
    }
  }

  return validationData
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
