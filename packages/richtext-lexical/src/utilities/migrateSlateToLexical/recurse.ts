import type { Field } from 'payload'

import { fieldAffectsData, fieldHasSubFields, fieldIsArrayType } from 'payload/shared'

import type {
  SlateNodeConverter,
  SlateNodeConverterProvider,
} from '../../features/migrations/slateToLexical/converter/types.js'
import type { LexicalRichTextAdapter } from '../../types.js'

import { convertSlateToLexical } from '../../features/migrations/slateToLexical/converter/index.js'

type NestedRichTextFieldsArgs = {
  data: unknown

  fields: Field[]
  found: number
}

export const migrateDocumentFields = ({
  data,
  fields,
  found,
}: NestedRichTextFieldsArgs): number => {
  for (const field of fields) {
    if (fieldHasSubFields(field) && !fieldIsArrayType(field)) {
      if (fieldAffectsData(field) && typeof data[field.name] === 'object') {
        migrateDocumentFields({
          data: data[field.name],
          fields: field.fields,
          found,
        })
      } else {
        migrateDocumentFields({
          data,
          found,

          fields: field.fields,
        })
      }
    } else if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        migrateDocumentFields({
          data,
          found,

          fields: tab.fields,
        })
      })
    } else if (Array.isArray(data[field.name])) {
      if (field.type === 'blocks') {
        data[field.name].forEach((row, i) => {
          const block = field.blocks.find(({ slug }) => slug === row?.blockType)
          if (block) {
            migrateDocumentFields({
              data: data[field.name][i],
              found,

              fields: block.fields,
            })
          }
        })
      }

      if (field.type === 'array') {
        data[field.name].forEach((_, i) => {
          migrateDocumentFields({
            data: data[field.name][i],
            found,

            fields: field.fields,
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

            const converterProviders = (
              slateToLexicalFeature.sanitizedServerFeatureProps as {
                converters?: SlateNodeConverterProvider[]
              }
            ).converters

            const converters: SlateNodeConverter[] = []

            for (const converter of converterProviders) {
              converters.push(converter.converter)
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
