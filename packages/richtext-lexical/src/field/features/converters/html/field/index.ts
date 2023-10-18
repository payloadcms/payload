import type { SerializedEditorState } from 'lexical'
import type { RichTextField, TextField } from 'payload/types'

import type { AdapterProps } from '../../../../../types'
import type { HTMLConverter } from '../converter/types'
import type { HTMLConverterFeatureProps } from '../index'

import { convertLexicalToHTML } from '../converter'
import { defaultConverters } from '../converter/defaultConverters'

type Props = {
  name: string
}

export const lexicalHTML: (lexicalFieldName: string, props: Props) => TextField = (
  lexicalFieldName,
  props,
) => {
  const { name = 'lexicalHTML' } = props
  return {
    name: name,
    hooks: {
      afterRead: [
        ({ context, data, originalDoc, req, siblingData }) => {
          console.log('lexicalHTML afterRead', originalDoc, siblingData, data, context)
          const lexicalField: RichTextField<SerializedEditorState, AdapterProps> =
            req.payload.collections[originalDoc.slug].config.fields.find(
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

          const config = lexicalField.editorConfig

          if (!config?.resolvedFeatureMap?.has('htmlConverter')) {
            throw new Error(
              'You cannot use the lexicalHTML field because the htmlConverter feature was not found',
            )
          }
          const htmlConverterFeature = config.resolvedFeatureMap.get('htmlConverter')
          const htmlConverterFeatureProps: HTMLConverterFeatureProps = htmlConverterFeature.props

          const defaultConvertersWithConvertersFromFeatures = defaultConverters
          for (const converter of config.features.converters.html) {
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

          return convertLexicalToHTML({
            converters: finalConverters,
            data: lexicalFieldData,
          })

          return ''
        },
      ],
    },
    type: 'text',
  }
}
