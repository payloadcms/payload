/* eslint-disable no-console */
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TextNode } from 'lexical'
import { type SanitizedClientFeatures } from 'packages/richtext-lexical/src/features/typesClient.js'
import { useEffect } from 'react'

export function TextPlugin({ features }: { features: SanitizedClientFeatures }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    console.log('features', features)
    return editor.registerNodeTransform(TextNode, (textNode) => {
      console.log('textNode', textNode)
    })
  }, [editor, features])

  return null
}
