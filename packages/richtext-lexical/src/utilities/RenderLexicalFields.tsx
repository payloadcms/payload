'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { FieldChangeNotifierProvider, RenderFields } from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import React, { useCallback, useEffect, useRef } from 'react'

import { PAYLOAD_FIELD_SYNC_TAG } from '../lexical/LexicalEditor.js'

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

  const pendingChanges = useRef<Map<string, unknown>>(new Map())
  const rafRef = useRef<null | ReturnType<typeof requestAnimationFrame>>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const handleFieldChange = useCallback(
    ({ path, value }: { path: string; value: unknown }) => {
      const relativePath = path.slice(parentPath.length + 1)
      if (relativePath.includes('.')) {
        return
      }

      pendingChanges.current.set(relativePath, value)

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        const changes = new Map(pendingChanges.current)
        pendingChanges.current.clear()

        editor.update(
          () => {
            const node = $getNodeByKey(nodeKey)
            if (node && 'setSubFieldValue' in node) {
              for (const [fieldPath, fieldValue] of changes) {
                ;(node as NodeWithSubFields).setSubFieldValue({
                  path: fieldPath,
                  value: fieldValue,
                })
              }
            }
          },
          { tag: ['history-merge', PAYLOAD_FIELD_SYNC_TAG] },
        )
      })
    },
    [editor, nodeKey, parentPath],
  )

  return (
    <FieldChangeNotifierProvider value={handleFieldChange}>
      <RenderFields {...renderFieldsProps} />
    </FieldChangeNotifierProvider>
  )
}
