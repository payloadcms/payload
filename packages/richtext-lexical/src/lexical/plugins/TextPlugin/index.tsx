import type { TextFormatType } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TEXT_TYPE_TO_FORMAT, TextNode } from 'lexical'
import { type SanitizedClientFeatures } from 'packages/richtext-lexical/src/features/typesClient.js'
import { useEffect } from 'react'

export function TextPlugin({ features }: { features: SanitizedClientFeatures }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const disabledFormats = getDisabledFormats(features.enabledFormats as TextFormatType[])
    return editor.registerNodeTransform(TextNode, (textNode) => {
      disabledFormats.forEach((disabledFormat) => {
        if (textNode.hasFormat(disabledFormat)) {
          textNode.toggleFormat(disabledFormat)
        }
      })
    })
  }, [editor, features])

  return null
}

function getDisabledFormats(enabledFormats: TextFormatType[]): TextFormatType[] {
  // not sure why Lexical added highlight as TextNode format.
  // see https://github.com/facebook/lexical/pull/3583
  // We are going to implement it in other way to support multiple colors
  delete TEXT_TYPE_TO_FORMAT.highlight
  const allFormats = Object.keys(TEXT_TYPE_TO_FORMAT) as TextFormatType[]
  const enabledSet = new Set(enabledFormats)

  return allFormats.filter((format) => !enabledSet.has(format))
}
