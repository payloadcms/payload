// @ts-strict-ignore
import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig, TypeWithID } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, JsonValue, PayloadRequest } from '../../../types/index.js'
import type { Block, Field, TabAsField } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { fieldAffectsData, tabHasName, valueIsValueWithRelation } from '../../config/types.js'
import { getFieldPathsModified as getFieldPaths } from '../../getFieldPaths.js'
import { getExistingRowDoc } from '../beforeChange/getExistingRowDoc.js'
import { getFallbackValue } from './getFallbackValue.js'
import { traverseFields } from './traverseFields.js'

type Args<T> = {
  /**
   * Data of the nearest parent block. If no parent block exists, this will be the `undefined`
   */
  blockData?: JsonObject
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: T
  /**
   * The original data (not modified by any hooks)
   */
  doc: T
  field: Field | TabAsField
  fieldIndex: number
  global: null | SanitizedGlobalConfig
  id?: number | string
  operation: 'create' | 'update'
  overrideAccess: boolean
  parentIndexPath: string
  parentIsLocalized: boolean
  parentPath: string
  parentSchemaPath: string
  req: PayloadRequest
  siblingData: JsonObject
  /**
   * The original siblingData (not modified by any hooks)
   */
  siblingDoc: JsonObject
  siblingFields?: (Field | TabAsField)[]
}

// This function is responsible for the following actions, in order:
// - Sanitize incoming data
// - Execute field hooks
// - Execute field access control
// - Merge original document data into incoming data
// - Compute default values for undefined fields

export const promise = async <T>({
  id,
  blockData,
  collection,
  context,
  data,
  doc,
  field,
  fieldIndex,
  global,
  operation,
  overrideAccess,
  parentIndexPath,
  parentIsLocalized,
  parentPath,
  parentSchemaPath,
  req,
  siblingData,
  siblingDoc,
  siblingFields,
}: Args<T>): Promise<void> => {
  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath,
  })

  const pathSegments = path ? path.split('.') : []
  const schemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const indexPathSegments = indexPath ? indexPath.split('-').filter(Boolean)?.map(Number) : []

  if (fieldAffectsData(field)) {
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
      case 'array':
      case 'blocks': {
        // Handle cases of arrays being intentionally set to 0
        if (siblingData[field.name] === '0' || siblingData[field.name] === 0) {
          siblingData[field.name] = []
        }

        break
      }

      case 'checkbox': {
        if (siblingData[field.name] === 'true') {
          siblingData[field.name] = true
        }
        if (siblingData[field.name] === 'false') {
          siblingData[field.name] = false
        }
        if (siblingData[field.name] === '') {
          siblingData[field.name] = false
        }

        break
      }

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
      case 'relationship':
      case 'upload': {
        if (
          siblingData[field.name] === '' ||
          siblingData[field.name] === 'none' ||
          siblingData[field.name] === 'null' ||
          siblingData[field.name] === null
        ) {
          if (field.hasMany === true) {
            siblingData[field.name] = []
          } else {
            siblingData[field.name] = null
          }
        }

        const value = siblingData[field.name]

        if (Array.isArray(field.relationTo)) {
          if (Array.isArray(value)) {
            value.forEach((relatedDoc: { relationTo: string; value: JsonValue }, i) => {
              const relatedCollection = req.payload.collections?.[relatedDoc.relationTo]?.config

              if (
                typeof relatedDoc.value === 'object' &&
                relatedDoc.value &&
                'id' in relatedDoc.value
              ) {
                relatedDoc.value = relatedDoc.value.id
              }

              if (relatedCollection?.fields) {
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
              }
            })
          }
          if (field.hasMany !== true && valueIsValueWithRelation(value)) {
            const relatedCollection = req.payload.collections?.[value.relationTo]?.config

            if (typeof value.value === 'object' && value.value && 'id' in value.value) {
              value.value = (value.value as TypeWithID).id
            }

            if (relatedCollection?.fields) {
              const relationshipIDField = relatedCollection.fields.find(
                (collectionField) =>
                  fieldAffectsData(collectionField) && collectionField.name === 'id',
              )
              if (relationshipIDField?.type === 'number') {
                siblingData[field.name] = { ...value, value: parseFloat(value.value as string) }
              }
            }
          }
        } else {
          if (Array.isArray(value)) {
            value.forEach((relatedDoc: unknown, i) => {
              const relatedCollection = Array.isArray(field.relationTo)
                ? undefined
                : req.payload.collections?.[field.relationTo]?.config

              if (typeof relatedDoc === 'object' && relatedDoc && 'id' in relatedDoc) {
                value[i] = relatedDoc.id
              }

              if (relatedCollection?.fields) {
                const relationshipIDField = relatedCollection.fields.find(
                  (collectionField) =>
                    fieldAffectsData(collectionField) && collectionField.name === 'id',
                )
                if (relationshipIDField?.type === 'number') {
                  siblingData[field.name][i] = parseFloat(relatedDoc as string)
                }
              }
            })
          }
          if (field.hasMany !== true && value) {
            const relatedCollection = req.payload.collections?.[field.relationTo]?.config

            if (typeof value === 'object' && value && 'id' in value) {
              siblingData[field.name] = value.id
            }

            if (relatedCollection?.fields) {
              const relationshipIDField = relatedCollection.fields.find(
                (collectionField) =>
                  fieldAffectsData(collectionField) && collectionField.name === 'id',
              )
              if (relationshipIDField?.type === 'number') {
                siblingData[field.name] = parseFloat(value as string)
              }
            }
          }
        }
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

      default: {
        break
      }
    }

    // ensure the fallback value is only computed one time
    // either here or when access control returns false
    const fallbackResult = {
      executed: false,
      value: undefined,
    }
    if (typeof siblingData[field.name] === 'undefined') {
      fallbackResult.value = await getFallbackValue({ field, req, siblingDoc })
      fallbackResult.executed = true
    }

    // Execute hooks
    if (field.hooks?.beforeValidate) {
      for (const hook of field.hooks.beforeValidate) {
        const hookedValue = await hook({
          blockData,
          collection,
          context,
          data,
          field,
          global,
          indexPath: indexPathSegments,
          operation,
          originalDoc: doc,
          overrideAccess,
          path: pathSegments,
          previousSiblingDoc: siblingDoc,
          previousValue: siblingDoc[field.name],
          req,
          schemaPath: schemaPathSegments,
          siblingData,
          siblingFields,
          value:
            typeof siblingData[field.name] === 'undefined'
              ? fallbackResult.value
              : siblingData[field.name],
        })

        if (hookedValue !== undefined) {
          siblingData[field.name] = hookedValue
        }
      }
    }

    // Execute access control
    if (field.access && field.access[operation]) {
      const result = overrideAccess
        ? true
        : await field.access[operation]({ id, blockData, data, doc, req, siblingData })

      if (!result) {
        delete siblingData[field.name]
      }
    }

    if (typeof siblingData[field.name] === 'undefined') {
      siblingData[field.name] = !fallbackResult.executed
        ? await getFallbackValue({ field, req, siblingDoc })
        : fallbackResult.value
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'array': {
      const rows = siblingData[field.name]

      if (Array.isArray(rows)) {
        const promises = []

        rows.forEach((row, rowIndex) => {
          promises.push(
            traverseFields({
              id,
              blockData,
              collection,
              context,
              data,
              doc,
              fields: field.fields,
              global,
              operation,
              overrideAccess,
              parentIndexPath: '',
              parentIsLocalized: parentIsLocalized || field.localized,
              parentPath: path + '.' + rowIndex,
              parentSchemaPath: schemaPath,
              req,
              siblingData: row as JsonObject,
              siblingDoc: getExistingRowDoc(row as JsonObject, siblingDoc[field.name]),
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

        rows.forEach((row, rowIndex) => {
          const rowSiblingDoc = getExistingRowDoc(row as JsonObject, siblingDoc[field.name])
          const blockTypeToMatch = (row as JsonObject).blockType || rowSiblingDoc.blockType

          const block: Block | undefined =
            req.payload.blocks[blockTypeToMatch] ??
            ((field.blockReferences ?? field.blocks).find(
              (curBlock) => typeof curBlock !== 'string' && curBlock.slug === blockTypeToMatch,
            ) as Block | undefined)

          if (block) {
            ;(row as JsonObject).blockType = blockTypeToMatch

            promises.push(
              traverseFields({
                id,
                blockData: row,
                collection,
                context,
                data,
                doc,
                fields: block.fields,
                global,
                operation,
                overrideAccess,
                parentIndexPath: '',
                parentIsLocalized: parentIsLocalized || field.localized,
                parentPath: path + '.' + rowIndex,
                parentSchemaPath: schemaPath + '.' + block.slug,
                req,
                siblingData: row as JsonObject,
                siblingDoc: rowSiblingDoc,
              }),
            )
          }
        })

        await Promise.all(promises)
      }

      break
    }

    case 'collapsible':
    case 'row': {
      await traverseFields({
        id,
        blockData,
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        overrideAccess,
        parentIndexPath: indexPath,
        parentIsLocalized,
        parentPath,
        parentSchemaPath: schemaPath,
        req,
        siblingData,
        siblingDoc,
      })

      break
    }

    case 'group': {
      if (typeof siblingData[field.name] !== 'object') {
        siblingData[field.name] = {}
      }

      if (typeof siblingDoc[field.name] !== 'object') {
        siblingDoc[field.name] = {}
      }

      const groupData = siblingData[field.name] as Record<string, unknown>
      const groupDoc = siblingDoc[field.name] as Record<string, unknown>

      await traverseFields({
        id,
        blockData,
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        overrideAccess,
        parentIndexPath: '',
        parentIsLocalized: parentIsLocalized || field.localized,
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        siblingData: groupData as JsonObject,
        siblingDoc: groupDoc as JsonObject,
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
        for (const hook of editor.hooks.beforeValidate) {
          const hookedValue = await hook({
            collection,
            context,
            data,
            field,
            global,
            indexPath: indexPathSegments,
            operation,
            originalDoc: doc,
            overrideAccess,
            parentIsLocalized,
            path: pathSegments,
            previousSiblingDoc: siblingDoc,
            previousValue: siblingData[field.name],
            req,
            schemaPath: schemaPathSegments,
            siblingData,
            value: siblingData[field.name],
          })

          if (hookedValue !== undefined) {
            siblingData[field.name] = hookedValue
          }
        }
      }
      break
    }

    case 'tab': {
      let tabSiblingData
      let tabSiblingDoc

      const isNamedTab = tabHasName(field)

      if (isNamedTab) {
        if (typeof siblingData[field.name] !== 'object') {
          siblingData[field.name] = {}
        }

        if (typeof siblingDoc[field.name] !== 'object') {
          siblingDoc[field.name] = {}
        }

        tabSiblingData = siblingData[field.name] as Record<string, unknown>
        tabSiblingDoc = siblingDoc[field.name] as Record<string, unknown>
      } else {
        tabSiblingData = siblingData
        tabSiblingDoc = siblingDoc
      }

      await traverseFields({
        id,
        blockData,
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        overrideAccess,
        parentIndexPath: isNamedTab ? '' : indexPath,
        parentIsLocalized: parentIsLocalized || field.localized,
        parentPath: isNamedTab ? path : parentPath,
        parentSchemaPath: schemaPath,
        req,
        siblingData: tabSiblingData,
        siblingDoc: tabSiblingDoc,
      })

      break
    }

    case 'tabs': {
      await traverseFields({
        id,
        blockData,
        collection,
        context,
        data,
        doc,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        global,
        operation,
        overrideAccess,
        parentIndexPath: indexPath,
        parentIsLocalized,
        parentPath: path,
        parentSchemaPath: schemaPath,
        req,
        siblingData,
        siblingDoc,
      })

      break
    }

    default: {
      break
    }
  }
}
