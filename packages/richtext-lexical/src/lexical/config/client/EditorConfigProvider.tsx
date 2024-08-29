'use client'

import type { LexicalEditor } from 'lexical'
import type { RichTextFieldClient } from 'payload'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import * as React from 'react'
import { createContext, useContext, useMemo, useRef, useState } from 'react'

import type { LexicalRichTextFieldProps } from '../../../types.js'
import type { SanitizedClientEditorConfig } from '../types.js'

// Should always produce a 20 character pseudo-random string
function generateQuickGuid(): string {
  return Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
}

export interface EditorConfigContextType {
  // Editor focus handling
  blurEditor: (editorContext: EditorConfigContextType) => void
  childrenEditors: React.RefObject<Map<string, EditorConfigContextType>>
  editor: LexicalEditor
  editorConfig: SanitizedClientEditorConfig
  editorContainerRef: React.RefObject<HTMLDivElement>
  field: LexicalRichTextFieldProps['field']
  // Editor focus handling
  focusEditor: (editorContext: EditorConfigContextType) => void
  focusedEditor: EditorConfigContextType | null
  parentEditor: EditorConfigContextType
  registerChild: (uuid: string, editorContext: EditorConfigContextType) => void
  unregisterChild?: (uuid: string) => void
  uuid: string
}

const Context: React.Context<EditorConfigContextType> = createContext({
  editorConfig: null,
  field: null,
  uuid: null,
})

export const EditorConfigProvider = ({
  children,
  editorConfig,
  editorContainerRef,
  field,
  parentContext,
}: {
  children: React.ReactNode
  editorConfig: SanitizedClientEditorConfig
  editorContainerRef: React.RefObject<HTMLDivElement>
  field: LexicalRichTextFieldProps['field']
  parentContext?: EditorConfigContextType
}): React.ReactNode => {
  const [editor] = useLexicalComposerContext()
  // State to store the UUID
  const [uuid] = useState(generateQuickGuid())

  const childrenEditors = useRef<Map<string, EditorConfigContextType>>(new Map())
  const [focusedEditor, setFocusedEditor] = useState<EditorConfigContextType | null>(null)
  const focusHistory = useRef<Set<string>>(new Set())

  const editorContext = useMemo(
    () =>
      ({
        blurEditor: (editorContext: EditorConfigContextType) => {
          //setFocusedEditor(null) // Clear focused editor
          focusHistory.current.clear() // Reset focus history when focus is lost
        },
        childrenEditors,
        editor,
        editorConfig,
        editorContainerRef,
        field,
        focusEditor: (editorContext: EditorConfigContextType) => {
          const editorUUID = editorContext.uuid

          // Avoid recursion by checking if this editor is already focused in this cycle
          if (focusHistory.current.has(editorUUID)) {
            return
          }

          // Add this editor to the history to prevent future recursions in this cycle
          focusHistory.current.add(editorUUID)
          setFocusedEditor(editorContext)

          // Propagate focus event to parent and children, ensuring they do not refocus this editor
          if (parentContext?.uuid) {
            parentContext.focusEditor(editorContext)
          }
          childrenEditors.current.forEach((childEditor, childUUID) => {
            childEditor.focusEditor(editorContext)
          })

          focusHistory.current.clear()
        },
        focusedEditor,
        parentEditor: parentContext,
        registerChild: (childUUID, childEditorContext) => {
          if (!childrenEditors.current.has(childUUID)) {
            const newMap = new Map(childrenEditors.current)
            newMap.set(childUUID, childEditorContext)
            childrenEditors.current = newMap
          }
        },
        unregisterChild: (childUUID) => {
          if (childrenEditors.current.has(childUUID)) {
            const newMap = new Map(childrenEditors.current)
            newMap.delete(childUUID)
            childrenEditors.current = newMap
          }
        },

        uuid,
      }) as EditorConfigContextType,
    [
      editor,
      childrenEditors,
      editorConfig,
      editorContainerRef,
      field,
      focusedEditor,
      parentContext,
      uuid,
    ],
  )

  return <Context.Provider value={editorContext}>{children}</Context.Provider>
}

export const useEditorConfigContext = (): EditorConfigContextType => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useEditorConfigContext must be used within an EditorConfigProvider')
  }
  return context
}
