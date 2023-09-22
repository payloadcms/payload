import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import * as React from 'react'
import { createContext, useContext, useMemo } from 'react'

import type { SanitizedEditorConfig } from './types'

import { defaultSanitizedEditorConfig } from './default'

// Should always produce a 20 character pseudo-random string
function generateQuickGuid(): string {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
}
interface ContextType {
  editorConfig: SanitizedEditorConfig
  uuid: string
}

const Context: React.Context<ContextType> = createContext({
  editorConfig: defaultSanitizedEditorConfig,
  uuid: generateQuickGuid(),
})

export const EditorConfigProvider = ({
  children,
  editorConfig,
}: {
  children: React.ReactNode
  editorConfig: SanitizedEditorConfig
}): JSX.Element => {
  const [editor] = useLexicalComposerContext()
  const editorContext = useMemo(() => ({ editorConfig, uuid: generateQuickGuid() }), [editor])

  return <Context.Provider value={editorContext}>{children}</Context.Provider>
}

export const useEditorConfigContext = (): ContextType => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useEditorConfigContext must be used within an EditorConfigProvider')
  }
  return context
}
