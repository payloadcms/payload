'use client'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEffect } from 'react'

import { registerEnsureRootNotEmpty } from './registerEnsureRootNotEmpty.js'

/**
 * Keeps the root node from ever being left without children - see
 * `registerEnsureRootNotEmpty` for why that state must not be saved.
 */
export function EnsureRootNotEmptyPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => registerEnsureRootNotEmpty(editor), [editor])

  return null
}
