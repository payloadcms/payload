import type { I18n } from '@payloadcms/translations'
import type { Field, FieldSchemaMap, SanitizedConfig, TabAsField } from 'payload'

import { MissingEditorProp } from 'payload'
import { fieldAffectsData, getFieldPaths, tabHasName } from 'payload/shared'

type Args = {
  config: SanitizedConfig
  fields: (Field | TabAsField)[]
  i18n: I18n<any, any>
  parentIndexPath: string
  parentSchemaPath: string
  schemaMap: FieldSchemaMap
}

export const traverseFields = ({
  config,
  fields,
  i18n,
  parentIndexPath,
  parentSchemaPath,
  schemaMap,
}: Args) => {
  for (const [index, field] of fields.entries()) {
    const { indexPath, schemaPath } = getFieldPaths({
      field,
      index,
      parentIndexPath,
      parentSchemaPath,
    })

    schemaMap.set(schemaPath, field)

    switch (field.type) {
      case 'array':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: '',
          parentSchemaPath: schemaPath,
          schemaMap,
        })

        break

      case 'blocks':
        ;(field.blockReferences ?? field.blocks).map((_block) => {
          // TODO: iterate over blocks mapped to block slug in v4, or pass through payload.blocks
          const block =
            typeof _block === 'string' ? config.blocks.find((b) => b.slug === _block) : _block

          const blockSchemaPath = `${schemaPath}.${block.slug}`

          schemaMap.set(blockSchemaPath, block)
          traverseFields({
            config,
            fields: block.fields,
            i18n,
            parentIndexPath: '',
            parentSchemaPath: schemaPath + '.' + block.slug,
            schemaMap,
          })
        })

        break

      case 'collapsible':
      case 'row':
        traverseFields({
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: indexPath,
          parentSchemaPath: schemaPath,
          schemaMap,
        })

        break

      case 'group':
        if (fieldAffectsData(field)) {
          traverseFields({
            config,
            fields: field.fields,
            i18n,
            parentIndexPath: '',
            parentSchemaPath: schemaPath,
            schemaMap,
          })
        } else {
          traverseFields({
            config,
            fields: field.fields,
            i18n,
            parentIndexPath: indexPath,
            parentSchemaPath: schemaPath,
            schemaMap,
          })
        }

        break

      case 'richText': {
        if (!field?.editor) {
          throw new MissingEditorProp(field) // while we allow disabling editor functionality, you should not have any richText fields defined if you do not have an editor
        }

        if (typeof field.editor === 'function') {
          throw new Error('Attempted to access unsanitized rich text editor.')
        }

        if (typeof field.editor.generateSchemaMap === 'function') {
          field.editor.generateSchemaMap({
            config,
            field,
            i18n,
            schemaMap,
            schemaPath,
          })
        }

        break
      }

      case 'tab': {
        const isNamedTab = tabHasName(field)

        traverseFields({
          config,
          fields: field.fields,
          i18n,
          parentIndexPath: isNamedTab ? '' : indexPath,
          parentSchemaPath: schemaPath,
          schemaMap,
        })

        break
      }

      case 'tabs': {
        traverseFields({
          config,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          i18n,
          parentIndexPath: indexPath,
          parentSchemaPath: schemaPath,
          schemaMap,
        })

        break
      }
    }
  }
}
