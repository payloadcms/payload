'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

import type { LexicalEditorNodeMap } from '../../../types.js'

import { registerEditorNodeViews } from '../../nodes/index.js'

export function NodeViewOverridePlugin({ nodeViews }: { nodeViews?: LexicalEditorNodeMap }): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (nodeViews) {
      registerEditorNodeViews(editor, nodeViews)
    }
  }, [editor, nodeViews])

  return null
}
