'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

import { useRichTextView } from '../../../field/RichTextViewProvider.js'
import { clearEditorNodeViews, registerEditorNodeViews } from '../../nodes/index.js'

export function NodeViewOverridePlugin(): null {
  const [editor] = useLexicalComposerContext()
  const { currentView } = useRichTextView()

  useEffect(() => {
    if (currentView.nodes) {
      registerEditorNodeViews(editor, currentView.nodes)
    } else {
      clearEditorNodeViews(editor)
    }
  }, [editor, currentView])

  return null
}
