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
  const fieldPathSegments = path ? path.split('.') : []
  const fieldSchemaPathSegments = schemaPath ? schemaPath.split('.') : []
  const fieldIndexPathSegments = indexPath ? indexPath.split('-').map(Number) : []

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
          indexPath: fieldIndexPathSegments,
          operation,
          originalDoc: doc,
          path: fieldPathSegments,
          previousDoc,
          previousSiblingDoc,
          previousValue: previousDoc[field.name],
          req,
          schemaPath: fieldSchemaPathSegments,
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
            indexPath: fieldIndexPathSegments,
            operation,
            originalDoc: doc,
            path: fieldPathSegments,
            previousDoc,
            previousSiblingDoc,
            previousValue: previousDoc[field.name],
            req,
            schemaPath: fieldSchemaPathSegments,
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

    case 'tabs': {
      field.tabs.forEach(async (tab, tabIndex) => {
        let tabSiblingData = siblingData
        let tabSiblingDoc = siblingDoc
        let tabPreviousSiblingDoc = siblingDoc

        const isNamedTab = tabHasName(tab)

        if (isNamedTab) {
          tabSiblingData = (siblingData[tab.name] as JsonObject) ?? {}
          tabSiblingDoc = (siblingDoc[tab.name] as JsonObject) ?? {}
          tabPreviousSiblingDoc = (previousDoc[tab.name] as JsonObject) ?? {}
        }

        const {
          indexPath: tabIndexPath,
          path: tabPath,
          schemaPath: tabSchemaPath,
        } = getFieldPaths({
          field: {
            ...tab,
            type: 'tab',
          },
          index: tabIndex,
          parentIndexPath: indexPath,
          parentPath,
          parentSchemaPath,
        })

        await traverseFields({
          collection,
          context,
          data,
          doc,
          fields: tab.fields,
          global,
          operation,
          parentIndexPath: isNamedTab ? '' : tabIndexPath,
          parentPath: isNamedTab ? tabPath : parentPath,
          parentSchemaPath: isNamedTab ? tabSchemaPath : parentSchemaPath,
          previousDoc,
          previousSiblingDoc: { ...tabPreviousSiblingDoc },
          req,
          siblingData: tabSiblingData || {},
          siblingDoc: { ...tabSiblingDoc },
        })
      })

      break
    }

    default: {
      break
    }
  }
}
