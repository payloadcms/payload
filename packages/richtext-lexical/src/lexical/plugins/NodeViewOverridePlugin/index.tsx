'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

import { registerEditorNodeOverride } from '../../nodes/index.js'

export function NodeViewOverridePlugin({ nodeType }: { nodeType?: string }): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (nodeType) {
      registerEditorNodeOverride(editor, nodeType)
    }
  }, [editor, nodeType])

  return null
}
