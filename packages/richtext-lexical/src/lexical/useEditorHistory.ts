'use client'

import type { HistoryState } from '@lexical/react/LexicalHistoryPlugin.js'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext.js'
import { createEmptyHistoryState } from '@lexical/react/LexicalHistoryPlugin.js'
import { useLexicalEditable } from '@lexical/react/useLexicalEditable'
import { mergeRegister } from '@lexical/utils'
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical'
import { useEffect, useMemo } from 'react'

export function useEditorHistory({
  id,
  collectionSlug,
  globalSlug,
  locale,
}: {
  collectionSlug?: string
  globalSlug?: string
  id?: number | string
  locale?: string
}): HistoryState {
  const [editor] = useLexicalComposerContext()
  const isEditable = useLexicalEditable()
  const historyState = useMemo(
    () => createEmptyHistoryState(),
    [collectionSlug, editor, globalSlug, id, locale],
  )

  useEffect(() => {
    editor.dispatchCommand(CAN_UNDO_COMMAND, isEditable && historyState.undoStack.length > 0)
    editor.dispatchCommand(CAN_REDO_COMMAND, isEditable && historyState.redoStack.length > 0)

    if (isEditable) {
      return
    }

    const clearHistory = () => Object.assign(historyState, createEmptyHistoryState())

    return mergeRegister(
      editor.registerCommand(
        CLEAR_EDITOR_COMMAND,
        () => {
          clearHistory()
          return false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CLEAR_HISTORY_COMMAND,
        () => {
          clearHistory()
          editor.dispatchCommand(CAN_UNDO_COMMAND, false)
          editor.dispatchCommand(CAN_REDO_COMMAND, false)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [editor, historyState, isEditable])

  return historyState
}
