'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

import type { LexicalEditorViewMap } from '../../../types.js'

import { clearEditorNodeViews, registerEditorNodeViews } from '../../nodes/index.js'

export function NodeViewOverridePlugin({
  currentView,
  views,
}: {
  currentView?: string
  views?: LexicalEditorViewMap
}): null {
  const [editor] = useLexicalComposerContext()
  const selectedView = currentView || 'default'

  useEffect(() => {
    if (!views) {
      return
    }

    if (selectedView === 'default') {
      if (views.default) {
        registerEditorNodeViews(editor, views.default)
      } else {
        clearEditorNodeViews(editor)
      }
    } else if (views[selectedView]) {
      clearEditorNodeViews(editor)
      registerEditorNodeViews(editor, views[selectedView])
    }
  }, [editor, views, selectedView])

  return null
}
