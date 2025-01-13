import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { fieldAffectsData, tabHasName } from '../../config/types.js'
import { getFieldPaths } from '../../getFieldPaths.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  collection: null | SanitizedCollectionConfig
  context: RequestContext
  data: JsonObject
  doc: JsonObject
  field: Field | TabAsField
  fieldIndex: number
  global: null | SanitizedGlobalConfig
  operation: 'create' | 'update'
  /**
   * The parent's path
   */
  parentPath: (number | string)[]
  /**
   * The parent's schemaPath (path without indexes).
   */
  parentSchemaPath: string[]
  previousDoc: JsonObject
  previousSiblingDoc: JsonObject
  req: PayloadRequest
  siblingData: JsonObject
  siblingDoc: JsonObject
}

// This function is responsible for the following actions, in order:
// - Execute field hooks

export const promise = async ({
  collection,
  context,
  data,
  doc,
  field,
  fieldIndex,
  global,
  operation,
  parentPath,
  parentSchemaPath,
  previousDoc,
  previousSiblingDoc,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  const { path: _fieldPath, schemaPath: _fieldSchemaPath } = getFieldPaths({
    field,
    index: fieldIndex,
    parentIndexPath: '', // Doesn't matter, as unnamed fields do not affect data, and hooks are only run on fields that affect data
    parentPath: parentPath.join('.'),
    parentSchemaPath: parentSchemaPath.join('.'),
  })
  const fieldPath = _fieldPath ? _fieldPath.split('.') : []
  const fieldSchemaPath = _fieldSchemaPath ? _fieldSchemaPath.split('.') : []

  if (fieldAffectsData(field)) {
    // Execute hooks
    if (field.hooks?.afterChange) {
      await field.hooks.afterChange.reduce(async (priorHook, currentHook) => {
        await priorHook

        const hookedValue = await currentHook({
          collection,
          context,
          data,
          field,
          global,
          operation,
          originalDoc: doc,
          path: fieldPath,
          previousDoc,
          previousSiblingDoc,
          previousValue: previousDoc[field.name],
          req,
          schemaPath: fieldSchemaPath,
          siblingData,
          value: siblingDoc[field.name],
        })

        if (hookedValue !== undefined) {
          siblingDoc[field.name] = hookedValue
        }
      }, Promise.resolve())
    }
  }

  // Traverse subfields
  switch (field.type) {
    case 'array': {
      const rows = siblingDoc[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row, i) => {
          promises.push(
            traverseFields({
              collection,
              context,
              data,
              doc,
              fields: field.fields,
              global,
              operation,
              path: [...fieldPath, i],
              previousDoc,
              previousSiblingDoc: previousDoc?.[field.name]?.[i] || ({} as JsonObject),
              req,
              schemaPath: fieldSchemaPath,
              siblingData: siblingData?.[field.name]?.[i] || {},
              siblingDoc: row ? { ...row } : {},
            }),
          )
        })
        await Promise.all(promises)
      }
      break
    }

    case 'blocks': {
      const rows = siblingDoc[field.name]

      if (Array.isArray(rows)) {
        const promises = []
        rows.forEach((row, i) => {
          const block = field.blocks.find(
            (blockType) => blockType.slug === (row as JsonObject).blockType,
          )

          if (block) {
            promises.push(
              traverseFields({
                collection,
                context,
                data,
                doc,
                fields: block.fields,
                global,
                operation,
                path: [...fieldPath, i],
                previousDoc,
                previousSiblingDoc: previousDoc?.[field.name]?.[i] || ({} as JsonObject),
                req,
                schemaPath: fieldSchemaPath,
                siblingData: siblingData?.[field.name]?.[i] || {},
                siblingDoc: row ? { ...row } : {},
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
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        path: fieldPath,
        previousDoc,
        previousSiblingDoc: { ...previousSiblingDoc },
        req,
        schemaPath: fieldSchemaPath,
        siblingData: siblingData || {},
        siblingDoc: { ...siblingDoc },
      })

      break
    }
    case 'group': {
      await traverseFields({
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        path: fieldPath,
        previousDoc,
        previousSiblingDoc: previousDoc[field.name] as JsonObject,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: (siblingData?.[field.name] as JsonObject) || {},
        siblingDoc: siblingDoc[field.name] as JsonObject,
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

      if (editor?.hooks?.afterChange?.length) {
        await editor.hooks.afterChange.reduce(async (priorHook, currentHook) => {
          await priorHook

          const hookedValue = await currentHook({
            collection,
            context,
            data,
            field,
            global,
            operation,
            originalDoc: doc,
            path: fieldPath,
            previousDoc,
            previousSiblingDoc,
            previousValue: previousDoc[field.name],
            req,
            schemaPath: fieldSchemaPath,
            siblingData,
            value: siblingDoc[field.name],
          })

          if (hookedValue !== undefined) {
            siblingDoc[field.name] = hookedValue
          }
        }, Promise.resolve())
      }
      break
    }

    case 'tab': {
      let tabSiblingData = siblingData
      let tabSiblingDoc = siblingDoc
      let tabPreviousSiblingDoc = siblingDoc

      if (tabHasName(field)) {
        tabSiblingData = (siblingData[field.name] as JsonObject) ?? {}
        tabSiblingDoc = (siblingDoc[field.name] as JsonObject) ?? {}
        tabPreviousSiblingDoc = (previousDoc[field.name] as JsonObject) ?? {}
      }

      await traverseFields({
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        path: fieldPath,
        previousDoc,
        previousSiblingDoc: tabPreviousSiblingDoc,
        req,
        schemaPath: fieldSchemaPath,
        siblingData: tabSiblingData,
        siblingDoc: tabSiblingDoc,
      })

      break
    }

    case 'tabs': {
      await traverseFields({
        collection,
        context,
        data,
        doc,
        fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
        global,
        operation,
        path: fieldPath,
        previousDoc,
        previousSiblingDoc: { ...previousSiblingDoc },
        req,
        schemaPath: fieldSchemaPath,
        siblingData: siblingData || {},
        siblingDoc: { ...siblingDoc },
      })
      break
    }

    default: {
      break
    }
  }
}
