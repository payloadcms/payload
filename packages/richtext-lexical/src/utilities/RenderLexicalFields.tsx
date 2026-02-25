'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { FieldChangeNotifierProvider, RenderFields } from '@payloadcms/ui'
import { $getNodeByKey } from 'lexical'
import React, { useCallback, useEffect, useRef } from 'react'

interface NodeWithSubFields {
  setSubFieldValue: (args: { path: string; value: unknown }) => void
}

type RenderLexicalFieldsProps = {
  readonly nodeKey: string
} & React.ComponentProps<typeof RenderFields>

/**
 * Drop-in replacement for `RenderFields` that syncs form field edits back
 * into the Lexical node via `setSubFieldValue()`. Changes are batched via
 * `requestAnimationFrame` to avoid resetting cursor position. On unmount,
 * pending changes are flushed synchronously so drawers closing don't lose
 * the last edit.
 *
 * No explicit cycle prevention is needed: `NodeFieldsSyncPlugin` (which
 * handles the reverse direction, node → form) compares against form state
 * via `getField()`. Because the form-state update that triggered this
 * flush already committed, the plugin sees matching values and skips.
 */
export const RenderLexicalFields: React.FC<RenderLexicalFieldsProps> = ({
  nodeKey,
  ...renderFieldsProps
}) => {
  const [editor] = useLexicalComposerContext()
  const { parentPath } = renderFieldsProps

  const pendingChanges = useRef<Map<string, unknown>>(new Map())
  const rafRef = useRef<null | ReturnType<typeof requestAnimationFrame>>(null)

  const flushPendingChanges = useCallback(() => {
    if (pendingChanges.current.size === 0) {
      return
    }
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
      { tag: 'history-merge' },
    )
  }, [editor, nodeKey])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      flushPendingChanges()
    }
  }, [flushPendingChanges])

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
        flushPendingChanges()
      })
    },
    [parentPath, flushPendingChanges],
  )

  return (
    <FieldChangeNotifierProvider value={handleFieldChange}>
      <RenderFields {...renderFieldsProps} />
    </FieldChangeNotifierProvider>
  )
}
