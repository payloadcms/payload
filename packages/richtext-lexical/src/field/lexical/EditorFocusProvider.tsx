import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import React, { createContext, useCallback, useContext, useState } from 'react'

import type { SanitizedClientEditorConfig } from './config/types.js'

import { useEditorConfigContext } from './config/client/EditorConfigProvider.js'

export type EditorFocusContextType = {
  blurEditor: () => void
  editor: LexicalEditor
  focusEditor: (_editor?: LexicalEditor, _editorConfig?: SanitizedClientEditorConfig) => void
  focusedEditor: LexicalEditor | null
  focusedEditorConfig: SanitizedClientEditorConfig
  isChildEditorFocused: () => boolean
  isEditorFocused: () => boolean
  isParentEditorFocused: () => boolean
  parentEditorConfig: SanitizedClientEditorConfig
  parentEditorFocus: EditorFocusContextType
}

const EditorFocusContext = createContext<EditorFocusContextType>({
  blurEditor: null,
  editor: null,
  focusEditor: null,
  focusedEditor: null,
  focusedEditorConfig: null,
  isChildEditorFocused: null,
  isEditorFocused: null,
  isParentEditorFocused: null,
  parentEditorConfig: null,
  parentEditorFocus: null,
})

export const useEditorFocus = (): EditorFocusContextType => {
  return useContext(EditorFocusContext)
}

export const EditorFocusProvider = ({ children }) => {
  const parentEditorFocus = useEditorFocus()
  const parentEditorConfig = useEditorConfigContext() // Is parent, as this EditorFocusProvider sits outside the EditorConfigProvider
  const [editor] = useLexicalComposerContext()

  const [focusedEditor, setFocusedEditor] = useState<LexicalEditor | null>(null)
  const [focusedEditorConfig, setFocusedEditorConfig] =
    useState<SanitizedClientEditorConfig | null>(null)

  const focusEditor = useCallback(
    (_editor: LexicalEditor, _editorConfig: SanitizedClientEditorConfig) => {
      setFocusedEditor(_editor !== undefined ? _editor : editor)
      setFocusedEditorConfig(_editorConfig)
      if (parentEditorFocus.focusEditor) {
        parentEditorFocus.focusEditor(_editor !== undefined ? _editor : editor, _editorConfig)
      }
    },
    [editor, parentEditorFocus],
  )

  const blurEditor = useCallback(() => {
    if (focusedEditor === editor) {
      setFocusedEditor(null)
      setFocusedEditorConfig(null)
    }
  }, [editor, focusedEditor])

  const isEditorFocused = useCallback(() => {
    return focusedEditor === editor
  }, [editor, focusedEditor])

  const isParentEditorFocused = useCallback(() => {
    return parentEditorFocus?.isEditorFocused ? parentEditorFocus.isEditorFocused() : false
  }, [parentEditorFocus])

  const isChildEditorFocused = useCallback(() => {
    return focusedEditor !== editor && !!focusedEditor
  }, [editor, focusedEditor])

  return (
    <EditorFocusContext.Provider
      value={{
        blurEditor,
        editor,
        focusEditor,
        focusedEditor,
        focusedEditorConfig,
        isChildEditorFocused,
        isEditorFocused,
        isParentEditorFocused,
        parentEditorConfig: parentEditorConfig?.editorConfig,
        parentEditorFocus,
      }}
    >
      {children}
    </EditorFocusContext.Provider>
  )
}
