'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { FieldChangeNotifierProvider, RenderFields } from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import React, { useCallback } from 'react'

interface NodeWithSubFields {
  setSubFieldValue: (args: { path: string; value: unknown }) => void
}

type RenderLexicalFieldsProps = {
  readonly nodeKey: string
} & React.ComponentProps<typeof RenderFields>

/**
 * Drop-in replacement for `RenderFields` that automatically syncs field value
 * changes back into the Lexical node via `node.setSubFieldValue()`.
 */
export const RenderLexicalFields: React.FC<RenderLexicalFieldsProps> = ({
  nodeKey,
  ...renderFieldsProps
}) => {
  const [editor] = useLexicalComposerContext()
  const { parentPath } = renderFieldsProps

  const handleFieldChange = useCallback(
    ({ path, value }: { path: string; value: unknown }) => {
      const relativePath = path.slice(parentPath.length + 1)
      if (relativePath.includes('.')) {
        return
      }
      editor.update(
        () => {
          const node = $getNodeByKey(nodeKey)
          if (node && 'setSubFieldValue' in node) {
            ;(node as NodeWithSubFields).setSubFieldValue({ path: relativePath, value })
          }
        },
        { tag: 'history-merge' },
      )
    },
    [editor, nodeKey, parentPath],
  )

  return (
    <FieldChangeNotifierProvider value={handleFieldChange}>
      <RenderFields {...renderFieldsProps} />
    </FieldChangeNotifierProvider>
  )
}
