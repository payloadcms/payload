import type { ArrayField, BlocksField, Field, TabAsField } from '../fields/config/types.js'

import { fieldHasSubFields } from '../fields/config/types.js'

const traverseArrayOrBlocksField = ({
  callback,
  data,
  field,
  parentRef,
}: {
  callback: TraverseFieldsCallback
  data: Record<string, unknown>[]
  field: ArrayField | BlocksField
  parentRef?: unknown
}) => {
  for (const ref of data) {
    let fields: Field[]
    if (field.type === 'blocks' && typeof ref?.blockType === 'string') {
      const block = field.blocks.find((block) => block.slug === ref.blockType)
      fields = block?.fields
    } else if (field.type === 'array') {
      fields = field.fields
    }

    if (fields) {
      traverseFields({ callback, fields, parentRef, ref })
    }
  }
}

export type TraverseFieldsCallback = (args: {
  /**
   * The current field
   */
  field: Field | TabAsField
  /**
   * Function that when called will skip the current field and continue to the next
   */
  next?: () => void
  /**
   * The parent reference object
   */
  parentRef?: Record<string, unknown> | unknown
  /**
   * The current reference object
   */
  ref?: Record<string, unknown> | unknown
}) => boolean | void

type TraverseFieldsArgs = {
  callback: TraverseFieldsCallback
  fields: (Field | TabAsField)[]
  /** fill empty properties to use this without data */
  fillEmpty?: boolean
  parentRef?: Record<string, unknown> | unknown
  ref?: Record<string, unknown> | unknown
}

/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param ref
 * @param parentRef
 */
export const traverseFields = ({
  callback,
  fields,
  fillEmpty = true,
  parentRef = {},
  ref = {},
}: TraverseFieldsArgs): void => {
  fields.some((field) => {
    let skip = false
    const next = () => {
      skip = true
    }
    if (callback && callback({ field, next, parentRef, ref })) {
      return true
    }
    if (skip) {
      return false
    }

    // avoid mutation of ref for all fields
    let currentRef = ref
    let currentParentRef = parentRef

    if (field.type === 'tabs' && 'tabs' in field) {
      for (const tab of field.tabs) {
        if ('name' in tab && tab.name) {
          if (!ref[tab.name] || typeof ref[tab.name] !== 'object') {
            if (fillEmpty) {
              ref[tab.name] = {}
            } else {
              continue
            }
          }

          parentRef = ref
          currentRef = ref[tab.name]

          if (tab.localized) {
            for (const key in currentRef as Record<string, unknown>) {
              if (currentRef[key] && typeof currentRef[key] === 'object') {
                traverseFields({ callback, fields: tab.fields, parentRef, ref: currentRef[key] })
              }
            }
            continue
          }
        }

        if (
          callback &&
          callback({ field: { ...tab, type: 'tab' }, next, parentRef, ref: currentRef })
        ) {
          return true
        }

        traverseFields({ callback, fields: tab.fields, parentRef, ref: currentRef })
      }

      return
    }
    if (field.type !== 'tab' && (fieldHasSubFields(field) || field.type === 'blocks')) {
      if ('name' in field && field.name) {
        currentParentRef = currentRef
        if (!ref[field.name]) {
          if (fillEmpty) {
            if (field.type === 'group') {
              ref[field.name] = {}
            } else if (field.type === 'array' || field.type === 'blocks') {
              if (field.localized) {
                ref[field.name] = {}
              } else {
                ref[field.name] = []
              }
            }
          } else {
            return
          }
        }
        currentRef = ref[field.name]
      }

      if (
        field.type === 'group' &&
        field.localized &&
        currentRef &&
        typeof currentRef === 'object'
      ) {
        for (const key in currentRef as Record<string, unknown>) {
          if (currentRef[key]) {
            traverseFields({
              callback,
              fields: field.fields,
              parentRef: currentParentRef,
              ref: currentRef[key],
            })
          }
        }
        return
      }

      if (
        (field.type === 'blocks' || field.type === 'array') &&
        currentRef &&
        typeof currentRef === 'object'
      ) {
        if (field.localized) {
          if (Array.isArray(currentRef)) {
            return
          }

          for (const key in currentRef as Record<string, unknown>) {
            const localeData = currentRef[key]
            if (!Array.isArray(localeData)) {
              continue
            }

            traverseArrayOrBlocksField({
              callback,
              data: localeData,
              field,
              parentRef: currentParentRef,
            })
          }
        } else if (Array.isArray(currentRef)) {
          traverseArrayOrBlocksField({
            callback,
            data: currentRef as Record<string, unknown>[],
            field,
            parentRef: currentParentRef,
          })
        }
      } else if (currentRef && typeof currentRef === 'object' && 'fields' in field) {
        traverseFields({
          callback,
          fields: field.fields,
          parentRef: currentParentRef,
          ref: currentRef,
        })
      }
    }
  })
}
