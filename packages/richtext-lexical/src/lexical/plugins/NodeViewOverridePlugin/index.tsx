'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { $getRoot, type LexicalNode } from 'lexical'
import { useEffect } from 'react'

import { useRichTextView } from '../../../field/RichTextViewProvider.js'
import { clearEditorNodeViews, registerEditorNodeViews } from '../../nodes/index.js'

// `LexicalComposer` re-mounts with a new `editor` whenever `currentView` changes,
// so decorator nodes run their initial `decorate()` before this effect registers the view's overrides.
// Mark existing block decorators dirty after registering so they re-decorate with the resolved custom `Block` component.
function refreshBlockDecorators(editor: ReturnType<typeof useLexicalComposerContext>[0]): void {
  editor.update(() => {
    const walk = (node: LexicalNode): void => {
      const type = node.getType()
      if (type === 'block' || type === 'inlineBlock') {
        node.markDirty()
      }
      if ('getChildren' in node && typeof node.getChildren === 'function') {
        for (const child of node.getChildren() as LexicalNode[]) {
          walk(child)
        }
      }
    }
    walk($getRoot())
  })
}

export function NodeViewOverridePlugin(): null {
  const [editor] = useLexicalComposerContext()
  const { currentView, views } = useRichTextView()

  useEffect(() => {
    if (!views) {
      return
    }

    if (currentView === 'default') {
      if (views.default) {
        registerEditorNodeViews(editor, views.default?.nodes)
      } else {
        clearEditorNodeViews(editor)
      }
    } else if (views[currentView]) {
      clearEditorNodeViews(editor)
      registerEditorNodeViews(editor, views[currentView]?.nodes)
    }

    refreshBlockDecorators(editor)
  }, [editor, views, currentView])

  return null
}
