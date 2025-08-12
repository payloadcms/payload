import { generateSlateRichText } from '../RichText/generateSlateRichText.js'
import { payloadPluginLexicalData } from './generatePayloadPluginLexicalData.js'

export const lexicalMigrateDocData = {
  title: 'Rich Text',
  lexicalWithLexicalPluginData: payloadPluginLexicalData,
  lexicalWithSlateData: [
    ...generateSlateRichText(),
    {
      children: [
        {
          text: 'Some block quote',
        },
      ],
      type: 'blockquote',
    },
  ],
  arrayWithLexicalField: [
    {
      lexicalInArrayField: getSimpleLexicalData('array 1'),
    },
    {
      lexicalInArrayField: getSimpleLexicalData('array 2'),
    },
  ],
}

export function getSimpleLexicalData(textContent: string) {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: textContent,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
    },
  }
}
