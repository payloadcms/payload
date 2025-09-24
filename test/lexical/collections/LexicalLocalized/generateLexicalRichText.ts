export function generateLexicalLocalizedRichText(text1: string, text2: string, blockID?: string) {
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
              text: text1,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
          textFormat: 0,
        },
        {
          format: '',
          type: 'block',
          version: 2,
          fields: {
            id: blockID ?? '66685716795f191f08367b1a',
            blockName: '',
            textLocalized: text2,
            counter: 1,
            blockType: 'blockLexicalLocalized',
          },
        },
      ],
      direction: 'ltr',
    },
  }
}
