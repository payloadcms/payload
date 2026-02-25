'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

import { useRichTextView } from '../../../field/RichTextViewProvider.js'
import { clearEditorNodeViews, registerEditorNodeViews } from '../../nodes/index.js'

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
  }, [editor, views, currentView])

  return null
}
