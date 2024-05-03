import type { LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import React, { createContext, useCallback, useContext, useState } from 'react'

import type { EditorConfigContextType } from './config/client/EditorConfigProvider.js'

import { useEditorConfigContext } from './config/client/EditorConfigProvider.js'

export type EditorFocusContextType = {
  blurEditor: () => void
  editor: LexicalEditor
  focusEditor: (_editor?: LexicalEditor, _editorConfigContext?: EditorConfigContextType) => void
  focusedEditor: LexicalEditor | null
  focusedEditorConfigContext: EditorConfigContextType
  isChildEditorFocused: () => boolean
  isEditorFocused: () => boolean
  isParentEditorFocused: () => boolean
  parentEditorConfigContext: EditorConfigContextType
  parentEditorFocus: EditorFocusContextType
}

const EditorFocusContext = createContext<EditorFocusContextType>({
  blurEditor: null,
  editor: null,
  focusEditor: null,
  focusedEditor: null,
  focusedEditorConfigContext: null,
  isChildEditorFocused: null,
  isEditorFocused: null,
  isParentEditorFocused: null,
  parentEditorConfigContext: null,
  parentEditorFocus: null,
})

export const useEditorFocus = (): EditorFocusContextType => {
  return useContext(EditorFocusContext)
}

export const EditorFocusProvider = ({ children }) => {
  const parentEditorFocus = useEditorFocus()
  const parentEditorConfigContext = useEditorConfigContext() // Is parent, as this EditorFocusProvider sits outside the EditorConfigProvider
  const [editor] = useLexicalComposerContext()

  const [focusedEditor, setFocusedEditor] = useState<LexicalEditor | null>(null)
  const [focusedEditorConfigContext, setFocusedEditorConfigContext] =
    useState<EditorConfigContextType | null>(null)

  const focusEditor = useCallback(
    (_editor: LexicalEditor, _editorConfigContext: EditorConfigContextType) => {
      setFocusedEditor(_editor !== undefined ? _editor : editor)
      setFocusedEditorConfigContext(_editorConfigContext)
      if (parentEditorFocus.focusEditor) {
        parentEditorFocus.focusEditor(
          _editor !== undefined ? _editor : editor,
          _editorConfigContext,
        )
      }
    },
    [editor, parentEditorFocus],
  )

  const blurEditor = useCallback(() => {
    if (focusedEditor === editor) {
      setFocusedEditor(null)
      setFocusedEditorConfigContext(null)
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
        focusedEditorConfigContext,
        isChildEditorFocused,
        isEditorFocused,
        isParentEditorFocused,
        parentEditorConfigContext,
        parentEditorFocus,
      }}
    >
      {children}
    </EditorFocusContext.Provider>
  )
}
