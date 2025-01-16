'use client'
import type { TextFormatType } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TEXT_TYPE_TO_FORMAT, TextNode } from 'lexical'
import { useEffect } from 'react'

import type { SanitizedClientFeatures } from '../../../features/typesClient.js'

export function TextPlugin({ features }: { features: SanitizedClientFeatures }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const disabledFormats = getDisabledFormats(features.enabledFormats as TextFormatType[])
    if (disabledFormats.length === 0) {
      return
    }
    // Ideally override the TextNode with our own TextNode (changing its setFormat or toggleFormat methods),
    // would be more performant. If we find a noticeable perf regression we can switch to that option.
    // Overriding the FORMAT_TEXT_COMMAND and PASTE_COMMAND commands is not an option I considered because
    // there might be other forms of mutation that we might not be considering. For example:
    // browser extensions or Payload/Lexical plugins that have their own commands.
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
  const allFormats = Object.keys(TEXT_TYPE_TO_FORMAT) as TextFormatType[]
  const enabledSet = new Set(enabledFormats)

  return allFormats.filter((format) => !enabledSet.has(format))
}
