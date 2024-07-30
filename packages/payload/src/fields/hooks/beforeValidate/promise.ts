import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { JsonObject, JsonValue, PayloadRequest, RequestContext } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { fieldAffectsData, tabHasName, valueIsValueWithRelation } from '../../config/types.js'
import { getDefaultValue } from '../../getDefaultValue.js'
import { getFieldPaths } from '../../getFieldPaths.js'
import { cloneDataFromOriginalDoc } from '../beforeChange/cloneDataFromOriginalDoc.js'
import { getExistingRowDoc } from '../beforeChange/getExistingRowDoc.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  collection: SanitizedCollectionConfig | null
  context: RequestContext
  data: T
  /**
   * The original data (not modified by any hooks)
   */
  doc: T
  field: Field | TabAsField
  global: SanitizedGlobalConfig | null
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  parentPath: (number | string)[]
  parentSchemaPath: string[]
  req: PayloadRequest
  siblingData: JsonObject
  /**
   * The original siblingData (not modified by any hooks)
   */
  siblingDoc: JsonObject
  siblingDocKeys: Set<string>
}

// This function is responsible for the following actions, in order:
// - Sanitize incoming data
// - Execute field hooks
// - Execute field access control
// - Merge original document data into incoming data
// - Compute default values for undefined fields

export const promise = async <T>({
  id,
  collection,
  context,
  data,
  doc,
  field,
  global,
  operation,
  overrideAccess,
  parentPath,
  parentSchemaPath,
  req,
  siblingData,
  siblingDoc,
  siblingDocKeys,
}: Args<T>): Promise<void> => {
  const { path: fieldPath, schemaPath: fieldSchemaPath } = getFieldPaths({
    field,
    parentPath,
    parentSchemaPath,
  })

  if (fieldAffectsData(field)) {
    // Remove the key from siblingDocKeys
    // the goal is to keep any existing data present
    // before updating, for users that want to maintain
    // external data in the same collections as Payload manages,
    // without having fields defined for them
    if (siblingDocKeys.has(field.name)) {
      siblingDocKeys.delete(field.name)
    }

    if (field.name === 'id') {
      if (field.type === 'number' && typeof siblingData[field.name] === 'string') {
        const value = siblingData[field.name] as string

        siblingData[field.name] = parseFloat(value)
      }

      if (
        field.type === 'text' &&
        typeof siblingData[field.name]?.toString === 'function' &&
        typeof siblingData[field.name] !== 'string'
      ) {
        siblingData[field.name] = siblingData[field.name].toString()
      }
    }

    // Sanitize incoming data
    switch (field.type) {
      case 'number': {
        if (typeof siblingData[field.name] === 'string') {
          const value = siblingData[field.name] as string
          const trimmed = value.trim()
          siblingData[field.name] = trimmed.length === 0 ? null : parseFloat(trimmed)
        }

        break
      }

      case 'point': {
        if (Array.isArray(siblingData[field.name])) {
          siblingData[field.name] = (siblingData[field.name] as string[]).map((coordinate, i) => {
            if (typeof coordinate === 'string') {
              const value = siblingData[field.name][i] as string
              const trimmed = value.trim()
              return trimmed.length === 0 ? null : parseFloat(trimmed)
            }
            return coordinate
          })
        }

        break
      }

      case 'checkbox': {
        if (siblingData[field.name] === 'true') siblingData[field.name] = true
        if (siblingData[field.name] === 'false') siblingData[field.name] = false
        if (siblingData[field.name] === '') siblingData[field.name] = false

        break
      }

      case 'richText': {
        if (typeof siblingData[field.name] === 'string') {
          try {
            const richTextJSON = JSON.parse(siblingData[field.name] as string)
            siblingData[field.name] = richTextJSON
          } catch {
            // Disregard this data as it is not valid.
            // Will be reported to user by field validation
          }
        }

        break
      }

      case 'relationship':
      case 'upload': {
        if (
          siblingData[field.name] === '' ||
          siblingData[field.name] === 'none' ||
          siblingData[field.name] === 'null' ||
          siblingData[field.name] === null
        ) {
          if (field.type === 'relationship' && field.hasMany === true) {
            siblingData[field.name] = []
          } else {
            siblingData[field.name] = null
          }
        }

        const value = siblingData[field.name]

        if (Array.isArray(field.relationTo)) {
          if (Array.isArray(value)) {
            value.forEach((relatedDoc: { relationTo: string; value: JsonValue }, i) => {
              const relatedCollection = req.payload.config.collections.find(
                (collection) => collection.slug === relatedDoc.relationTo,
              )
              const relationshipIDField = relatedCollection.fields.find(
                (collectionField) =>
                  fieldAffectsData(collectionField) && collectionField.name === 'id',
              )
              if (relationshipIDField?.type === 'number') {
                siblingData[field.name][i] = {
                  ...relatedDoc,
                  value: parseFloat(relatedDoc.value as string),
                }
              }
            })
          }
          if (
            field.type === 'relationship' &&
            field.hasMany !== true &&
            valueIsValueWithRelation(value)
          ) {
            const relatedCollection = req.payload.config.collections.find(
              (collection) => collection.slug === value.relationTo,
            )
            const relationshipIDField = relatedCollection.fields.find(
              (collectionField) =>
                fieldAffectsData(collectionField) && collectionField.name === 'id',
            )
            if (relationshipIDField?.type === 'number') {
              siblingData[field.name] = { ...value, value: parseFloat(value.value as string) }
            }
          }
        } else {
          if (Array.isArray(value)) {
            value.forEach((relatedDoc: unknown, i) => {
              const relatedCollection = req.payload.config.collections.find(
                (collection) => collection.slug === field.relationTo,
              )
              const relationshipIDField = relatedCollection.fields.find(
                (collectionField) =>
                  fieldAffectsData(collectionField) && collectionField.name === 'id',
              )
              if (relationshipIDField?.type === 'number') {
                siblingData[field.name][i] = parseFloat(relatedDoc as string)
              }
            })
          }
          if (field.type === 'relationship' && field.hasMany !== true && value) {
            const relatedCollection = req.payload.config.collections.find(
              (collection) => collection.slug === field.relationTo,
            )
            const relationshipIDField = relatedCollection.fields.find(
              (collectionField) =>
                fieldAffectsData(collectionField) && collectionField.name === 'id',
            )
            if (relationshipIDField?.type === 'number') {
              siblingData[field.name] = parseFloat(value as string)
            }
          }
        }
        break
      }

      case 'array':
      case 'blocks': {
        // Handle cases of arrays being intentionally set to 0
        if (siblingData[field.name] === '0' || siblingData[field.name] === 0) {
          siblingData[field.name] = []
        }

        break
      }

      default: {
        break
      }
    }

    // Execute hooks
    if (field.hooks?.beforeValidate) {
      await field.hooks.beforeValidate.reduce(async (priorHook, currentHook) => {
        await priorHook

        const hookedValue = await currentHook({
          collection,
          context,
          data,
          field,
          global,
          operation,
          originalDoc: doc,
          overrideAccess,
          path: fieldPath,
          previousSiblingDoc: siblingDoc,
          previousValue: siblingData[field.name],
          req,
          schemaPath: fieldSchemaPath,
          siblingData,
          value: siblingData[field.name],
        })

        if (hookedValue !== undefined) {
          siblingData[field.name] = hookedValue
        }
      }, Promise.resolve())
    }

    // Execute access control
    if (field.access && field.access[operation]) {
      const result = overrideAccess
        ? true
        : await field.access[operation]({ id, data, doc, req, siblingData })

      if (!result) {
        delete siblingData[field.name]
      }
    }

    if (typeof siblingData[field.name] === 'undefined') {
      // If no incoming data, but existing document data is found, merge it in
      if (typeof siblingDoc[field.name] !== 'undefined') {
        siblingData[field.name] = cloneDataFromOriginalDoc(siblingDoc[field.name] as any)

        // Otherwise compute default value
      } else if (typeof field.defaultValue !== 'undefined') {
        siblingData[field.name] = await getDefaultValue({
          defaultValue: field.defaultValue,
          locale: req.locale,
          user: req.user,
          value: siblingData[field.name],
        })
      }
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'group': {
      if (typeof siblingData[field.name] !== 'object') siblingData[field.name] = {}
      if (typeof siblingDoc[field.name] !== 'object') siblingDoc[field.name] = {}

      const groupData = siblingData[field.name] as Record<string, unknown>
      const groupDoc = siblingDoc[field.name] as Record<string, unknown>

      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        overrideAccess,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: groupData as JsonObject,
        siblingDoc: groupDoc as JsonObject,
        siblingDocKeys,
      })

      break
    }

    case 'array': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row, i) => {
          promises.push(
            traverseFields({
              id,
              collection,
              context,
              data,
              doc,
              fields: field.fields,
              global,
              operation,
              overrideAccess,
              path: [...fieldPath, i],
              req,
              schemaPath: fieldSchemaPath,
              siblingData: row as JsonObject,
              siblingDoc: getExistingRowDoc(row as JsonObject, siblingDoc[field.name]),
              siblingDocKeys,
            }),
          )
        })
        await Promise.all(promises)
      }
      break
    }

    case 'blocks': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row, i) => {
          const rowSiblingDoc = getExistingRowDoc(row as JsonObject, siblingDoc[field.name])
          const blockTypeToMatch = (row as JsonObject).blockType || rowSiblingDoc.blockType
          const block = field.blocks.find((blockType) => blockType.slug === blockTypeToMatch)

          if (block) {
            ;(row as JsonObject).blockType = blockTypeToMatch

            promises.push(
              traverseFields({
                id,
                collection,
                context,
                data,
                doc,
                fields: block.fields,
                global,
                operation,
                overrideAccess,
                path: [...fieldPath, i],
                req,
                schemaPath: fieldSchemaPath,
                siblingData: row as JsonObject,
                siblingDoc: rowSiblingDoc,
                siblingDocKeys,
              }),
            )
          }
        })
        await Promise.all(promises)
      }

      break
    }

    case 'row':
    case 'collapsible': {
      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        overrideAccess,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData,
        siblingDoc,
        siblingDocKeys,
      })

      break
    }

    case 'tab': {
      let tabSiblingData
      let tabSiblingDoc

      const isNamedTab = tabHasName(field)

      if (isNamedTab) {
        if (typeof siblingData[field.name] !== 'object') siblingData[field.name] = {}
        if (typeof siblingDoc[field.name] !== 'object') siblingDoc[field.name] = {}

        tabSiblingData = siblingData[field.name] as Record<string, unknown>
        tabSiblingDoc = siblingDoc[field.name] as Record<string, unknown>
      } else {
        tabSiblingData = siblingData
        tabSiblingDoc = siblingDoc
      }

      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        overrideAccess,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: tabSiblingData,
        siblingDoc: tabSiblingDoc,
        siblingDocKeys: isNamedTab ? undefined : siblingDocKeys,
      })

      break
    }

    case 'tabs': {
      await traverseFields({
        id,
        collection,
        context,
        data,
        doc,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        global,
        operation,
        overrideAccess,
        path: fieldPath,
        req,
        schemaPath: fieldSchemaPath,
        siblingData,
        siblingDoc,
        siblingDocKeys,
      })

      break
    }

    case 'richText': {
      if (!field?.editor) {
        throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
      }
      if (typeof field?.editor === 'function') {
        throw new Error('Attempted to access unsanitized rich text editor.')
      }

      const editor: RichTextAdapter = field?.editor

      if (editor?.hooks?.beforeValidate?.length) {
        await editor.hooks.beforeValidate.reduce(async (priorHook, currentHook) => {
          await priorHook

          const hookedValue = await currentHook({
            collection,
            context,
            data,
            field,
            global,
            operation,
            originalDoc: doc,
            overrideAccess,
            path: fieldPath,
            previousSiblingDoc: siblingDoc,
            previousValue: siblingData[field.name],
            req,
            schemaPath: fieldSchemaPath,
            siblingData,
            value: siblingData[field.name],
          })

          if (hookedValue !== undefined) {
            siblingData[field.name] = hookedValue
          }
        }, Promise.resolve())
      }
      break
    }

    default: {
      break
    }
  }
}
