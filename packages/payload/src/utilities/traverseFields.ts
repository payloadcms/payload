// @ts-strict-ignore
import type { Config, SanitizedConfig } from '../config/types.js'
import type { ArrayField, Block, BlocksField, Field, TabAsField } from '../fields/config/types.js'

import { fieldHasSubFields, fieldShouldBeLocalized } from '../fields/config/types.js'

const traverseArrayOrBlocksField = ({
  callback,
  callbackStack,
  config,
  data,
  field,
  fillEmpty,
  leavesFirst,
  parentIsLocalized,
  parentRef,
}: {
  callback: TraverseFieldsCallback
  callbackStack: (() => ReturnType<TraverseFieldsCallback>)[]
  config?: Config | SanitizedConfig
  data: Record<string, unknown>[]
  field: ArrayField | BlocksField
  fillEmpty: boolean
  leavesFirst: boolean
  parentIsLocalized: boolean
  parentRef?: unknown
}) => {
  if (fillEmpty) {
    if (field.type === 'array') {
      traverseFields({
        callback,
        callbackStack,
        config,
        fields: field.fields,
        isTopLevel: false,
        leavesFirst,
        parentIsLocalized: parentIsLocalized || field.localized,
        parentRef,
      })
    }
    if (field.type === 'blocks') {
      for (const _block of field.blockReferences ?? field.blocks) {
        // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
        const block =
          typeof _block === 'string' ? config?.blocks?.find((b) => b.slug === _block) : _block
        if (block) {
          traverseFields({
            callback,
            callbackStack,
            config,
            fields: block.fields,
            isTopLevel: false,
            leavesFirst,
            parentIsLocalized: parentIsLocalized || field.localized,
            parentRef,
          })
        }
      }
    }
    return
  }
  for (const ref of data) {
    let fields: Field[]
    if (field.type === 'blocks' && typeof ref?.blockType === 'string') {
      // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
      const block = field.blockReferences
        ? ((config?.blocks?.find((b) => b.slug === ref.blockType) ??
            field.blockReferences.find(
              (b) => typeof b !== 'string' && b.slug === ref.blockType,
            )) as Block)
        : field.blocks.find((b) => b.slug === ref.blockType)

      fields = block?.fields
    } else if (field.type === 'array') {
      fields = field.fields
    }

    if (fields) {
      traverseFields({
        callback,
        callbackStack,
        config,
        fields,
        fillEmpty,
        isTopLevel: false,
        leavesFirst,
        parentIsLocalized: parentIsLocalized || field.localized,
        parentRef,
        ref,
      })
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
  parentIsLocalized: boolean
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
  callbackStack?: (() => ReturnType<TraverseFieldsCallback>)[]
  config?: Config | SanitizedConfig
  fields: (Field | TabAsField)[]
  fillEmpty?: boolean
  isTopLevel?: boolean
  /**
   * @default false
   *
   * if this is `true`, the callback functions of the leaf fields will be called before the parent fields.
   * The return value of the callback function will be ignored.
   */
  leavesFirst?: boolean
  parentIsLocalized?: boolean
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
  callbackStack: _callbackStack = [],
  config,
  fields,
  fillEmpty = true,
  isTopLevel = true,
  leavesFirst = false,
  parentIsLocalized,
  parentRef = {},
  ref = {},
}: TraverseFieldsArgs): void => {
  fields.some((field) => {
    let callbackStack: (() => ReturnType<TraverseFieldsCallback>)[] = []
    if (!isTopLevel) {
      callbackStack = _callbackStack
    }
    let skip = false
    const next = () => {
      skip = true
    }

    if (!ref || typeof ref !== 'object') {
      return
    }

    if (!leavesFirst && callback && callback({ field, next, parentIsLocalized, parentRef, ref })) {
      return true
    } else if (leavesFirst) {
      callbackStack.push(() => callback({ field, next, parentIsLocalized, parentRef, ref }))
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
            !leavesFirst &&
            callback({
              field: { ...tab, type: 'tab' },
              next,
              parentIsLocalized,
              parentRef: currentParentRef,
              ref: tabRef,
            })
          ) {
            return true
          } else if (leavesFirst) {
            callbackStack.push(() =>
              callback({
                field: { ...tab, type: 'tab' },
                next,
                parentIsLocalized,
                parentRef: currentParentRef,
                ref: tabRef,
              }),
            )
          }

          tabRef = tabRef[tab.name]

          if (tab.localized) {
            for (const key in tabRef as Record<string, unknown>) {
              if (tabRef[key] && typeof tabRef[key] === 'object') {
                traverseFields({
                  callback,
                  callbackStack,
                  config,
                  fields: tab.fields,
                  fillEmpty,
                  isTopLevel: false,
                  leavesFirst,
                  parentIsLocalized: true,
                  parentRef: currentParentRef,
                  ref: tabRef[key],
                })
              }
            }
          }
        } else {
          if (
            callback &&
            !leavesFirst &&
            callback({
              field: { ...tab, type: 'tab' },
              next,
              parentIsLocalized,
              parentRef: currentParentRef,
              ref: tabRef,
            })
          ) {
            return true
          } else if (leavesFirst) {
            callbackStack.push(() =>
              callback({
                field: { ...tab, type: 'tab' },
                next,
                parentIsLocalized,
                parentRef: currentParentRef,
                ref: tabRef,
              }),
            )
          }
        }

        if (!tab.localized) {
          traverseFields({
            callback,
            callbackStack,
            config,
            fields: tab.fields,
            fillEmpty,
            isTopLevel: false,
            leavesFirst,
            parentIsLocalized: false,
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
              if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
                ref[field.name] = {
                  en: {},
                }
              } else {
                ref[field.name] = {}
              }
            } else if (field.type === 'array' || field.type === 'blocks') {
              if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
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
        fieldShouldBeLocalized({ field, parentIsLocalized }) &&
        currentRef &&
        typeof currentRef === 'object'
      ) {
        for (const key in currentRef as Record<string, unknown>) {
          if (currentRef[key]) {
            traverseFields({
              callback,
              callbackStack,
              config,
              fields: field.fields,
              fillEmpty,
              isTopLevel: false,
              leavesFirst,
              parentIsLocalized: true,
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
        if (fieldShouldBeLocalized({ field, parentIsLocalized })) {
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
              callbackStack,
              config,
              data: localeData,
              field,
              fillEmpty,
              leavesFirst,
              parentIsLocalized: true,
              parentRef: currentParentRef,
            })
          }
        } else if (Array.isArray(currentRef)) {
          traverseArrayOrBlocksField({
            callback,
            callbackStack,
            config,
            data: currentRef as Record<string, unknown>[],
            field,
            fillEmpty,
            leavesFirst,
            parentIsLocalized,
            parentRef: currentParentRef,
          })
        }
      } else if (currentRef && typeof currentRef === 'object' && 'fields' in field) {
        traverseFields({
          callback,
          callbackStack,
          config,
          fields: field.fields,
          fillEmpty,
          isTopLevel: false,
          leavesFirst,
          parentIsLocalized,
          parentRef: currentParentRef,
          ref: currentRef,
        })
      }
    }

    if (isTopLevel) {
      callbackStack.reverse().forEach((cb) => {
        cb()
      })
    }
  })
}
