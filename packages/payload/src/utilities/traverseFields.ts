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
    if (field.type === 'tabs' && 'tabs' in field) {
      field.tabs.forEach((tab) => {
        if ('name' in tab && tab.name) {
          if (typeof ref[tab.name] === 'undefined') {
            ref[tab.name] = {}
          }
          ref = ref[tab.name]
        }
        if (callback && callback({ field: { ...tab, type: 'tab' }, next, parentRef, ref })) {
          return true
        }
        traverseFields({ callback, fields: tab.fields, parentRef, ref })
      })
      return
    }
    if (field.type !== 'tab' && (fieldHasSubFields(field) || field.type === 'blocks')) {
      const parentRef = ref
      if ('name' in field && field.name) {
        if (typeof ref[field.name] === 'undefined') {
          if (field.type === 'array' || field.type === 'blocks') {
            if (field.localized) {
              ref[field.name] = {}
            } else {
              ref[field.name] = []
            }
          }
          if (field.type === 'group') {
            ref[field.name] = {}
          }
        }
        ref = ref[field.name]
      }

      if (field.type === 'blocks' || field.type === 'array') {
        if (field.localized) {
          for (const key in (ref ?? {}) as Record<string, unknown>) {
            const localeData = ref[key]
            if (!Array.isArray(localeData)) {
              continue
            }

            traverseArrayOrBlocksField({
              callback,
              data: localeData,
              field,
              parentRef,
            })
          }
        } else if (Array.isArray(ref)) {
          traverseArrayOrBlocksField({
            callback,
            data: ref,
            field,
            parentRef,
          })
        }
      } else {
        traverseFields({ callback, fields: field.fields, parentRef, ref })
      }
    }
  })
}
