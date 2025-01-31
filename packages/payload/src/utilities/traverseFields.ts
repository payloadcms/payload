import type { SanitizedConfig } from '../config/types.js'
import type { ArrayField, Block, BlocksField, Field, TabAsField } from '../fields/config/types.js'

import { fieldHasSubFields } from '../fields/config/types.js'

const traverseArrayOrBlocksField = ({
  callback,
  config,
  data,
  field,
  fillEmpty,
  parentRef,
}: {
  callback: TraverseFieldsCallback
  config: SanitizedConfig
  data: Record<string, unknown>[]
  field: ArrayField | BlocksField
  fillEmpty: boolean
  parentRef?: unknown
}) => {
  if (fillEmpty) {
    if (field.type === 'array') {
      traverseFields({ callback, config, fields: field.fields, parentRef })
    }
    if (field.type === 'blocks') {
      for (const _block of field.blocks) {
        // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
        const block =
          typeof _block === 'string' ? config.blocks.find((b) => b.slug === _block) : _block
        traverseFields({ callback, config, fields: block.fields, parentRef })
      }
    }
    return
  }
  for (const ref of data) {
    let fields: Field[]
    if (field.type === 'blocks' && typeof ref?.blockType === 'string') {
      // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
      const block = [...config.blocks, ...field.blocks].find(
        (block) => typeof block !== 'string' && block.slug === ref.blockType,
      ) as Block | undefined
      fields = block?.fields
    } else if (field.type === 'array') {
      fields = field.fields
    }

    if (fields) {
      traverseFields({ callback, config, fields, fillEmpty, parentRef, ref })
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
  config: SanitizedConfig
  fields: (Field | TabAsField)[]
  fillEmpty?: boolean
  parentRef?: Record<string, unknown> | unknown
  ref?: Record<string, unknown> | unknown
}

/**
 * Iterate a recurse an array of fields, calling a callback for each field
 *
 * @param fields
 * @param callback callback called for each field, discontinue looping if callback returns truthy
 * @param fillEmpty fill empty properties to use this without data
 * @param ref the data or any artifacts assigned in the callback during field recursion
 * @param parentRef the data or any artifacts assigned in the callback during field recursion one level up
 */
export const traverseFields = ({
  callback,
  config,
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

    if (!ref || typeof ref !== 'object') {
      return
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
        let tabRef = ref

        if (skip) {
          return false
        }

        if ('name' in tab && tab.name) {
          if (!ref[tab.name] || typeof ref[tab.name] !== 'object') {
            if (fillEmpty) {
              if (tab.localized) {
                ref[tab.name] = { en: {} }
              } else {
                ref[tab.name] = {}
              }
            } else {
              continue
            }
          }

          if (
            callback &&
            callback({
              field: { ...tab, type: 'tab' },
              next,
              parentRef: currentParentRef,
              ref: tabRef,
            })
          ) {
            return true
          }

          tabRef = tabRef[tab.name]

          if (tab.localized) {
            for (const key in tabRef as Record<string, unknown>) {
              if (tabRef[key] && typeof tabRef[key] === 'object') {
                traverseFields({
                  callback,
                  config,
                  fields: tab.fields,
                  fillEmpty,
                  parentRef: currentParentRef,
                  ref: tabRef[key],
                })
              }
            }
          }
        } else {
          if (
            callback &&
            callback({
              field: { ...tab, type: 'tab' },
              next,
              parentRef: currentParentRef,
              ref: tabRef,
            })
          ) {
            return true
          }
        }

        if (!tab.localized) {
          traverseFields({
            callback,
            config,
            fields: tab.fields,
            fillEmpty,
            parentRef: currentParentRef,
            ref: tabRef,
          })
        }

        if (skip) {
          return false
        }
      }

      return
    }

    if (field.type !== 'tab' && (fieldHasSubFields(field) || field.type === 'blocks')) {
      if ('name' in field && field.name) {
        currentParentRef = currentRef
        if (!ref[field.name]) {
          if (fillEmpty) {
            if (field.type === 'group') {
              if (field.localized) {
                ref[field.name] = {
                  en: {},
                }
              } else {
                ref[field.name] = {}
              }
            } else if (field.type === 'array' || field.type === 'blocks') {
              if (field.localized) {
                ref[field.name] = {
                  en: [],
                }
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
              config,
              fields: field.fields,
              fillEmpty,
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
              config,
              data: localeData,
              field,
              fillEmpty,
              parentRef: currentParentRef,
            })
          }
        } else if (Array.isArray(currentRef)) {
          traverseArrayOrBlocksField({
            callback,
            config,
            data: currentRef as Record<string, unknown>[],
            field,
            fillEmpty,
            parentRef: currentParentRef,
          })
        }
      } else if (currentRef && typeof currentRef === 'object' && 'fields' in field) {
        traverseFields({
          callback,
          config,
          fields: field.fields,
          fillEmpty,
          parentRef: currentParentRef,
          ref: currentRef,
        })
      }
    }
  })
}
