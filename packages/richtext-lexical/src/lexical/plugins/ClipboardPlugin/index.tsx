'use client'

import { copyToClipboard } from '@lexical/clipboard'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { objectKlassEquals } from '@lexical/utils'
import ObjectID from 'bson-objectid'
import { COMMAND_PRIORITY_LOW, COPY_COMMAND } from 'lexical'
import { useEffect } from 'react'

type SerializedUnknownLexicalNode = {
  children?: SerializedUnknownLexicalNode[]
  type: string
}

export function ClipboardPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    // Remove duplicated ids from clipboard. We do it here because:
    // 1. Browsers do not allow setting the clipboardData in paste event for security reasons.
    // 2. If you cut instead of paste, the id will be kept, which is a good thing.
    return editor.registerCommand(
      COPY_COMMAND,
      (event) => {
        copyToClipboard(editor, objectKlassEquals(event, ClipboardEvent) ? event : null)
          .then(() => {
            if (!(event instanceof ClipboardEvent) || !event.clipboardData) {
              throw new Error('No clipboard event')
            }
            const lexicalStringified = event.clipboardData.getData('application/x-lexical-editor')
            if (!lexicalStringified) {
              return true
            }

            const lexical = JSON.parse(lexicalStringified) as {
              nodes: SerializedUnknownLexicalNode[]
            }
            const changeIds = (node: SerializedUnknownLexicalNode) => {
              if (
                'fields' in node &&
                typeof node.fields === 'object' &&
                node.fields !== null &&
                'id' in node.fields
              ) {
                node.fields.id = new ObjectID.default().toHexString()
              } else if ('id' in node) {
                node.id = new ObjectID.default().toHexString()
              }

              if (node.children) {
                for (const child of node.children) {
                  changeIds(child)
                }
              }
            }
            for (const node of lexical.nodes) {
              changeIds(node)
            }
            const stringified = JSON.stringify(lexical)
            event.clipboardData.setData('application/x-lexical-editor', stringified)
          })
          .catch((error) => {
            if (event instanceof ClipboardEvent) {
              event.clipboardData?.setData('application/x-lexical-editor', '')
            }
            throw error
          })
        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  }, [editor, features])

  return null
}
