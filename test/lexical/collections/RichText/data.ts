import { generateLexicalRichText } from './generateLexicalRichText.js'

export const richTextBlocks = [
  {
    blockType: 'textBlock',
    text: 'Regular text',
  },
]
export const richTextDocData = {
  title: 'Rich Text',
  selectHasMany: ['one', 'five'],
  lexicalCustomFields: generateLexicalRichText(),
  blocks: richTextBlocks,
}
