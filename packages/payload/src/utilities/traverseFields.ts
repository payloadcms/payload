import type {
  ArrayField,
  BlocksField,
  Field,
  FlattenedArrayField,
  FlattenedBlock,
  FlattenedField,
  TabAsField,
} from '../fields/config/types.js'

import { fieldHasSubFields } from '../fields/config/types.js'

const traverseArrayOrBlocksField = ({
  callback,
  data,
  field,
  fillEmpty,
  parentRef,
}: {
  callback: TraverseFieldsCallback
  data: Record<string, unknown>[]
  field: ArrayField | BlocksField
  fillEmpty?: boolean
  parentRef?: unknown
}) => {
  for (const ref of data) {
    let fields: Field[]
    let flattenedFields: FlattenedField[]
    if (field.type === 'blocks' && typeof ref?.blockType === 'string') {
      const block = field.blocks.find((block) => block.slug === ref.blockType) as FlattenedBlock
      fields = block?.fields
      flattenedFields = block?.flattenedFields
    } else if (field.type === 'array') {
      fields = field.fields
      flattenedFields = (field as FlattenedArrayField)?.flattenedFields
    }

    if (flattenedFields || fields) {
      traverseFields({ callback, fields, fillEmpty, flattenedFields, parentRef, ref })
    }
  }
}

type TraverseFieldsCallbackArgs = {
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
}

export type TraverseFieldsCallback = (args: TraverseFieldsCallbackArgs) => boolean | void

export type TraverseFlattenedFieldsCallback = (args: {
  /**
   * The current field
   */
  field: FlattenedField
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

type TraverseFlattenedFieldsArgs = {
  callback: TraverseFlattenedFieldsCallback
  fields?: Field[]
  /** fill empty properties to use this without data */
  fillEmpty?: boolean
  flattenedFields: FlattenedField[]
  parentRef?: Record<string, unknown> | unknown
  ref?: Record<string, unknown> | unknown
}

type TraverseFieldsArgs = {
  callback: TraverseFieldsCallback
  fields: (Field | FlattenedField | TabAsField)[]
  /** fill empty properties to use this without data */
  fillEmpty?: boolean
  flattenedFields?: FlattenedField[]
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
  flattenedFields,
  parentRef = {},
  ref = {},
}: TraverseFieldsArgs | TraverseFlattenedFieldsArgs): void => {
  ;(flattenedFields ?? fields).some((field) => {
    let skip = false
    const next = () => {
      skip = true
    }

    if (!ref || typeof ref !== 'object') {
      return
    }

    if (
      callback &&
      callback({
        // @ts-expect-error compatibillity Field | FlattenedField
        field,
        next,
        parentRef,
        ref,
      })
    ) {
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
        if ('name' in tab && tab.name) {
          if (!ref[tab.name] || typeof ref[tab.name] !== 'object') {
            if (fillEmpty) {
              ref[tab.name] = {}
            } else {
              continue
            }
          }

          tabRef = tabRef[tab.name]

          if (tab.localized) {
            for (const key in tabRef as Record<string, unknown>) {
              if (tabRef[key] && typeof tabRef[key] === 'object') {
                traverseFields({
                  callback,
                  fields: tab.fields,
                  fillEmpty,
                  parentRef: currentParentRef,
                  ref: tabRef[key],
                })
              }
            }
            continue
          }
        }

        if (
          callback &&
          callback({
            // @ts-expect-error compatibillity Field | FlattenedField
            field: { ...tab, type: 'tab' },
            next,
            parentRef: currentParentRef,
            ref: tabRef,
          })
        ) {
          return true
        }

        traverseFields({
          callback,
          fields: tab.fields,
          fillEmpty,
          parentRef: currentParentRef,
          ref: tabRef,
        })
      }

      return
    }

    if (
      (flattenedFields || field.type !== 'tab') &&
      (fieldHasSubFields(field as Field) || field.type === 'tab' || field.type === 'blocks')
    ) {
      if ('name' in field && field.name) {
        currentParentRef = currentRef
        if (!ref[field.name]) {
          if (fillEmpty) {
            if (field.type === 'group' || field.type === 'tab') {
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
        (field.type === 'group' || field.type === 'tab') &&
        field.localized &&
        currentRef &&
        typeof currentRef === 'object'
      ) {
        for (const key in currentRef as Record<string, unknown>) {
          if (currentRef[key]) {
            traverseFields({
              callback,
              fields: field.fields,
              fillEmpty,
              flattenedFields: 'flattenedFields' in field ? field.flattenedFields : undefined,
              parentRef: currentParentRef,
              ref: currentRef[key],
            } as TraverseFieldsArgs)
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
              fillEmpty,
              parentRef: currentParentRef,
            })
          }
        } else if (Array.isArray(currentRef)) {
          traverseArrayOrBlocksField({
            callback,
            data: currentRef as Record<string, unknown>[],
            field,
            fillEmpty,
            parentRef: currentParentRef,
          })
        }
      } else if (currentRef && typeof currentRef === 'object' && 'fields' in field) {
        traverseFields({
          callback,
          fields: field.fields,
          fillEmpty,
          flattenedFields: 'flattenedFields' in field ? field.flattenedFields : undefined,
          parentRef: currentParentRef,
          ref: currentRef,
        })
      }
    }
  })
}
