import type { Field } from '../fields/config/types.js'
import type { PayloadRequest } from '../types/index.js'

import { fieldAffectsData, fieldShouldBeLocalized } from '../fields/config/types.js'
import { deepCopyObject } from '../utilities/deepCopyObject.js'
import { traverseFields } from '../utilities/traverseFields.js'

type ValidationContext = {
  blockData?: Record<string, unknown>
  data: Record<string, unknown>
  isParentLocalized: boolean
  path: string[]
  shouldSkipValidation?: boolean
}

/** Project the values ordinary updates validate, preserving the original merge candidate. */
export const prepareValidationData = ({
  data,
  fields,
  req,
}: {
  data: Record<string, unknown>
  fields: Field[]
  req: PayloadRequest
}): Record<string, unknown> => {
  const validationData = deepCopyObject(data)
  const contexts = new WeakMap<object, ValidationContext>([
    [validationData, { data, isParentLocalized: false, path: [] }],
  ])
  const skippedFields = new Map<Record<string, unknown>, Set<string>>()
  const localization = req.payload.config.localization
  const locale = req.locale || (localization ? localization.defaultLocale : 'en')

  traverseFields({
    callback: ({ field, ref }) => {
      if (!isRecord(ref)) {
        return
      }
      const context = contexts.get(ref)

      if (!context) {
        return
      }
      const name = fieldAffectsData(field) ? field.name : undefined
      const path = name ? [...context.path, name] : context.path
      const shouldSkipValidation =
        context.shouldSkipValidation ||
        (name && skippedFields.get(ref)?.has(name)) ||
        (field.admin?.condition &&
          !field.admin.condition(data, context.data, {
            blockData: context.blockData!,
            operation: 'update',
            path,
            user: req.user,
          }))
      const isLocalized = fieldShouldBeLocalized({
        field,
        parentIsLocalized: context.isParentLocalized,
      })
      const isLocalizedFallback =
        localization &&
        locale !== localization.defaultLocale &&
        isLocalized &&
        (field.type === 'array' || field.type === 'blocks') &&
        ref[field.name] === null

      if (shouldSkipValidation || isLocalizedFallback) {
        const skipped = skippedFields.get(ref) ?? new Set<string>()

        // Schema traversal also finds the data owned by unnamed conditional containers.
        traverseFields({
          callback: ({ field, parentPath }) => {
            if (!parentPath && fieldAffectsData(field) && field.name) {
              skipped.add(field.name)
            }
          },
          config: req.payload.config,
          fields: [field],
        })
        skippedFields.set(ref, skipped)
      }

      if (!name) {
        return
      }
      const value = ref[name]
      const originalValue = context.data[name]
      const children = Array.isArray(value) ? value : [value]
      const originalChildren = Array.isArray(originalValue) ? originalValue : [originalValue]

      children.forEach((child, index) => {
        const originalChild = originalChildren[index]

        if (isRecord(child) && isRecord(originalChild)) {
          contexts.set(child, {
            blockData: field.type === 'blocks' ? originalChild : context.blockData,
            data: originalChild,
            isParentLocalized: context.isParentLocalized || isLocalized,
            path: Array.isArray(value) ? [...path, String(index)] : path,
            shouldSkipValidation: Boolean(shouldSkipValidation),
          })
        }
      })
    },
    config: req.payload.config,
    fields,
    fillEmpty: false,
    // Candidates already contain one locale; prevent traversal from treating groups as locale maps.
    parentIsLocalized: true,
    ref: validationData,
  })

  for (const [ref, names] of skippedFields) {
    for (const name of names) {
      delete ref[name]
    }
  }

  return validationData
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value))
