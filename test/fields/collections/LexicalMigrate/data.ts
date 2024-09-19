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

export function getAlignIndentLexicalData(textContent: string) {
  return {
    root: {
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
          format: 'center',
          indent: 0,
          type: 'heading',
          version: 1,
          tag: 'h2',
        },
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
          format: 'left',
          indent: 2,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

/**
 * If the HTML Conversion structure of the heading and paragraph changes, must edit this.
 */
export function getAlignIndentHTMLData(textContent: string) {
  return `<h2 style="text-align: center;">${textContent}</h2><p style="text-indent: 40px; text-align: left;">${textContent}</p>`
}
