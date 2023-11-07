import { generateLexicalRichText } from './generateLexicalRichText'
import { payloadPluginLexicalData } from './generatePayloadPluginLexicalData'

export const lexicalRichTextDoc = {
  title: 'Rich Text',
  richTextLexicalCustomFields: generateLexicalRichText(),
  richTextLexicalWithLexicalPluginData: payloadPluginLexicalData,
}
