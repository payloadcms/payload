import type { Field } from 'payload'

import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType, tabHasName } from 'payload/shared'

import type { SlateNodeConverter } from '../../features/migrations/slateToLexical/converter/types.js'
import type { LexicalRichTextAdapter } from '../../types.js'

import { convertSlateToLexical } from '../../features/migrations/slateToLexical/converter/index.js'

type NestedRichTextFieldsArgs = {
  data: unknown

  fields: Field[]
  found: number
}

export const migrateDocumentFieldsRecursively = ({
  data,
  fields,
  found,
}: NestedRichTextFieldsArgs): number => {
  for (const field of fields) {
    if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
      if (fieldAffectsData(field) && typeof data[field.name] === 'object') {
        found += migrateDocumentFieldsRecursively({
          data: data[field.name],
          fields: field.fields,
          found,
        })
      } else {
        found += migrateDocumentFieldsRecursively({
          data,
          fields: field.fields,
          found,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        found += migrateDocumentFieldsRecursively({
          data: tabHasName(tab) ? data[tab.name] : data,
          fields: tab.fields,
          found,
        })
      })
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        data[field.name].forEach((row, i) => {
          const block = field.blocks.find(({ slug }) => slug === row?.blockType)
          if (block) {
            found += migrateDocumentFieldsRecursively({
              data: data[field.name][i],
              fields: block.fields,
              found,
            })
          }
        })
      }

      if (field.type === 'array') {
        data[field.name].forEach((_, i) => {
          found += migrateDocumentFieldsRecursively({
            data: data[field.name][i],
            fields: field.fields,
            found,
          })
        })
      }
    }

    if (field.type === 'richText' && Array.isArray(data[field.name])) {
      // Slate richText
      const editor: LexicalRichTextAdapter = field.editor as LexicalRichTextAdapter
      if (editor && typeof editor === 'object') {
        if ('features' in editor && editor.features?.length) {
          // find slatetolexical feature
          const slateToLexicalFeature = editor.editorConfig.resolvedFeatureMap.get('slateToLexical')
          if (slateToLexicalFeature) {
            // DO CONVERSION

            const { converters } = slateToLexicalFeature.sanitizedServerFeatureProps as {
              converters?: SlateNodeConverter[]
            }

            data[field.name] = convertSlateToLexical({
              converters,
              slateData: data[field.name],
            })

            found++
          }
        }
      }
    }
  }

  return found
}
