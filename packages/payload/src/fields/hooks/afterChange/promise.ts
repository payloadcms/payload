import type { RichTextAdapter } from '../../../admin/RichText.js'
import type { SanitizedCollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js'
import type { RequestContext } from '../../../index.js'
import type { JsonObject, PayloadRequest } from '../../../types/index.js'
import type { Field, TabAsField } from '../../config/types.js'

import { MissingEditorProp } from '../../../errors/index.js'
import { fieldAffectsData, tabHasName } from '../../config/types.js'
import { getFieldPathsModified as getFieldPaths } from '../../getFieldPaths.js'
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
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
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
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  previousDoc,
  previousSiblingDoc,
  req,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
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
          indexPath: indexPathSegments,
          operation,
          originalDoc: doc,
          path: pathSegments,
          previousDoc,
          previousSiblingDoc,
          previousValue: previousDoc[field.name],
          req,
          schemaPath: schemaPathSegments,
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
        rows.forEach((row, rowIndex) => {
          promises.push(
            traverseFields({
              collection,
              context,
              data,
              doc,
              fields: field.fields,
              global,
              operation,
              parentIndexPath: '',
              parentPath: path + '.' + rowIndex,
              parentSchemaPath: schemaPath,
              previousDoc,
              previousSiblingDoc: previousDoc?.[field.name]?.[rowIndex] || ({} as JsonObject),
              req,
              siblingData: siblingData?.[field.name]?.[rowIndex] || {},
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

        rows.forEach((row, rowIndex) => {
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
                parentIndexPath: '',
                parentPath: path + '.' + rowIndex,
                parentSchemaPath: schemaPath + '.' + block.slug,
                previousDoc,
                previousSiblingDoc: previousDoc?.[field.name]?.[rowIndex] || ({} as JsonObject),
                req,
                siblingData: siblingData?.[field.name]?.[rowIndex] || {},
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
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath: schemaPath,
        previousDoc,
        previousSiblingDoc: { ...previousSiblingDoc },
        req,
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
        parentIndexPath: '',
        parentPath: path,
        parentSchemaPath: schemaPath,
        previousDoc,
        previousSiblingDoc: previousDoc[field.name] as JsonObject,
        req,
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
            indexPath: indexPathSegments,
            operation,
            originalDoc: doc,
            path: pathSegments,
            previousDoc,
            previousSiblingDoc,
            previousValue: previousDoc[field.name],
            req,
            schemaPath: schemaPathSegments,
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

      const isNamedTab = tabHasName(field)

      if (isNamedTab) {
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
        parentIndexPath: isNamedTab ? '' : indexPath,
        parentPath: isNamedTab ? path : parentPath,
        parentSchemaPath: schemaPath,
        previousDoc,
        previousSiblingDoc: tabPreviousSiblingDoc,
        req,
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
        parentIndexPath: indexPath,
        parentPath: path,
        parentSchemaPath: schemaPath,
        previousDoc,
        previousSiblingDoc: { ...previousSiblingDoc },
        req,
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
