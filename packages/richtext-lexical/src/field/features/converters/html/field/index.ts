import type { SerializedEditorState } from 'lexical'
import type { RichTextField, TextField } from 'payload/types'

import type { LexicalRichTextAdapter, SanitizedEditorConfig } from '../../../../../index'
import type { AdapterProps } from '../../../../../types'
import type { HTMLConverter } from '../converter/types'
import type { HTMLConverterFeatureProps } from '../index'

import { convertLexicalToHTML } from '../converter'
import { defaultHTMLConverters } from '../converter/defaultConverters'

type Props = {
  name: string
}

/**
 * Combines the default HTML converters with HTML converters found in the features, and with HTML converters configured in the htmlConverter feature.
 *
 * @param editorConfig
 */
export const consolidateHTMLConverters = ({
  editorConfig,
}: {
  editorConfig: SanitizedEditorConfig
}) => {
  const htmlConverterFeature = editorConfig.resolvedFeatureMap.get('htmlConverter')
  const htmlConverterFeatureProps: HTMLConverterFeatureProps = htmlConverterFeature?.props

  const defaultConvertersWithConvertersFromFeatures = defaultHTMLConverters

  for (const converter of editorConfig.features.converters.html) {
    defaultConvertersWithConvertersFromFeatures.push(converter)
  }

  const finalConverters =
    htmlConverterFeatureProps?.converters &&
    typeof htmlConverterFeatureProps?.converters === 'function'
      ? htmlConverterFeatureProps.converters({
          defaultConverters: defaultConvertersWithConvertersFromFeatures,
        })
      : (htmlConverterFeatureProps?.converters as HTMLConverter[]) ||
        defaultConvertersWithConvertersFromFeatures

  return finalConverters
}

export const lexicalHTML: (lexicalFieldName: string, props: Props) => TextField = (
  lexicalFieldName,
  props,
) => {
  const { name = 'lexicalHTML' } = props
  return {
    name: name,
    admin: {
      hidden: true,
    },
    hooks: {
      afterRead: [
        async ({ collection, context, data, originalDoc, siblingData }) => {
          const lexicalField: RichTextField<SerializedEditorState, AdapterProps> =
            collection.fields.find(
              (field) => 'name' in field && field.name === lexicalFieldName,
            ) as RichTextField<SerializedEditorState, AdapterProps>

          const lexicalFieldData: SerializedEditorState = siblingData[lexicalFieldName]

          if (!lexicalFieldData) {
            return ''
          }

          if (!lexicalField) {
            throw new Error(
              'You cannot use the lexicalHTML field because the lexical field was not found',
            )
          }

          const config = (lexicalField?.editor as LexicalRichTextAdapter)?.editorConfig

          if (!config) {
            throw new Error(
              'The linked lexical field does not have an editorConfig. This is needed for the lexicalHTML field.',
            )
          }

          if (!config?.resolvedFeatureMap?.has('htmlConverter')) {
            throw new Error(
              'You cannot use the lexicalHTML field because the htmlConverter feature was not found',
            )
          }

          const finalConverters = consolidateHTMLConverters({
            editorConfig: config,
          })

          return await convertLexicalToHTML({
            converters: finalConverters,
            data: lexicalFieldData,
          })
        },
      ],
    },
    type: 'text',
  }
}
