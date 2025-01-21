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
  indexPath: string
  operation: 'create' | 'update'
  parentIndexPath: string
  parentPath: string
  parentSchemaPath: string
  path: string
  previousDoc: JsonObject
  previousSiblingDoc: JsonObject
  req: PayloadRequest
  schemaPath: string
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
  indexPath,
  operation,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  path,
  previousDoc,
  previousSiblingDoc,
  req,
  schemaPath,
  siblingData,
  siblingDoc,
}: Args): Promise<void> => {
  const pathSegments = path ? path.split('.') : []
  const schemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const indexPathSegments = indexPath ? indexPath.split('-').map(Number) : []

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
              parentIndexPath: '',
              parentPath,
              parentSchemaPath: schemaPath,
              previousDoc,
              previousSiblingDoc: previousDoc?.[field.name]?.[i] || ({} as JsonObject),
              req,
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
                parentIndexPath: '',
                parentPath,
                parentSchemaPath: schemaPath + '.' + block.slug,
                previousDoc,
                previousSiblingDoc: previousDoc?.[field.name]?.[i] || ({} as JsonObject),
                req,
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
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath,
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
      const isNamedTab = tabHasName(field)

      const {
        indexPath: tabIndexPath,
        path: tabPath,
        schemaPath: tabSchemaPath,
      } = getFieldPaths({
        field: {
          ...field,
          type: 'tab',
        },
        index: fieldIndex,
        parentIndexPath: indexPath,
        parentPath,
        parentSchemaPath,
      })

      await traverseFields({
        collection,
        context,
        data,
        doc,
        fields: field.fields,
        global,
        operation,
        parentIndexPath: isNamedTab ? '' : tabIndexPath,
        parentPath: isNamedTab ? tabPath : parentPath,
        parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
        previousDoc,
        previousSiblingDoc: isNamedTab
          ? ((previousDoc[field.name] as JsonObject) ?? {})
          : siblingDoc,
        req,
        siblingData: isNamedTab ? ((siblingData[field.name] as JsonObject) ?? {}) : siblingData,
        siblingDoc: isNamedTab ? ((siblingDoc[field.name] as JsonObject) ?? {}) : siblingDoc,
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
        parentIndexPath,
        parentPath: path,
        parentSchemaPath,
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
