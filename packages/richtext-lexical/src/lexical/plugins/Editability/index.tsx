'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

export function EditabilityPlugin({ isReadOnly }: { isReadOnly: boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    editor.setEditable(!isReadOnly)
  }, [editor, isReadOnly])

  return null
}
