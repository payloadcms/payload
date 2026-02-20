'use client'

import type { LexicalEditor } from 'lexical'
import type { MarkRequired } from 'ts-essentials'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { useEditDepth } from '@payloadcms/ui'
import * as React from 'react'
import { createContext, use, useMemo, useRef, useState } from 'react'

import type { InlineBlockNode } from '../../../features/blocks/client/nodes/InlineBlocksNode.js'
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
  createdInlineBlock?: InlineBlockNode
  editDepth: number
  editor: LexicalEditor
  editorConfig: SanitizedClientEditorConfig
  editorContainerRef: React.RefObject<HTMLDivElement>
  fieldProps: MarkRequired<LexicalRichTextFieldProps, 'path' | 'schemaPath'>
  focusedEditor: EditorConfigContextType | null
  // Editor focus handling
  focusEditor: (editorContext: EditorConfigContextType) => void
  parentEditor: EditorConfigContextType
  registerChild: (uuid: string, editorContext: EditorConfigContextType) => void
  setCreatedInlineBlock?: React.Dispatch<React.SetStateAction<InlineBlockNode | undefined>>
  unregisterChild?: (uuid: string) => void
  uuid: string
}

// @ts-expect-error: TODO: Fix this
const Context: React.Context<EditorConfigContextType> = createContext({
  editorConfig: null,
  fieldProps: null,
  uuid: null,
})

export const EditorConfigProvider = ({
  children,
  editorConfig,
  editorContainerRef,
  fieldProps,
  parentContext,
}: {
  children: React.ReactNode
  editorConfig: SanitizedClientEditorConfig
  editorContainerRef: React.RefObject<HTMLDivElement | null>

  fieldProps: LexicalRichTextFieldProps
  parentContext?: EditorConfigContextType
}): React.ReactNode => {
  const [editor] = useLexicalComposerContext()
  // State to store the UUID
  const [uuid] = useState(() => generateQuickGuid())

  const childrenEditors = useRef<Map<string, EditorConfigContextType>>(new Map())
  const [focusedEditor, setFocusedEditor] = useState<EditorConfigContextType | null>(null)
  const focusHistory = useRef<Set<string>>(new Set())
  const [createdInlineBlock, setCreatedInlineBlock] = useState<InlineBlockNode>()

  const editDepth = useEditDepth()

  const editorContext = useMemo(
    () =>
      ({
        blurEditor: (editorContext: EditorConfigContextType) => {
          //setFocusedEditor(null) // Clear focused editor
          focusHistory.current.clear() // Reset focus history when focus is lost
        },
        childrenEditors,
        createdInlineBlock,
        editDepth,
        editor,
        editorConfig,
        editorContainerRef,
        fieldProps,
        focusedEditor,
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
          childrenEditors.current.forEach((childEditor) => {
            childEditor.focusEditor(editorContext)
          })

          focusHistory.current.clear()
        },
        parentEditor: parentContext,
        registerChild: (childUUID, childEditorContext) => {
          if (!childrenEditors.current.has(childUUID)) {
            const newMap = new Map(childrenEditors.current)
            newMap.set(childUUID, childEditorContext)
            childrenEditors.current = newMap
          }
        },
        setCreatedInlineBlock,
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
      createdInlineBlock,
      setCreatedInlineBlock,
      editor,
      childrenEditors,
      editorConfig,
      editorContainerRef,
      editDepth,
      fieldProps,
      focusedEditor,
      parentContext,
      uuid,
    ],
  )

  return <Context value={editorContext}>{children}</Context>
}

export const useEditorConfigContext = (): EditorConfigContextType => {
  const context = use(Context)
  if (context === undefined) {
    throw new Error('useEditorConfigContext must be used within an EditorConfigProvider')
  }
  return context
}
