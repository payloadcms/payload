'use client'

import type {
  BaseSelection,
  EditorThemeClasses,
  Klass,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
} from 'lexical'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TablePlugin as LexicalReactTablePlugin } from '@lexical/react/LexicalTablePlugin'
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { mergeRegister } from '@lexical/utils'
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical'
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as React from 'react'

import type { PluginComponent } from '../../../../typesClient.js'

import { TableGridPopup } from './TableGridPopup/index.js'
import './index.css'

export type CellContextShape = {
  cellEditorConfig: CellEditorConfig | null
  cellEditorPlugins: Array<JSX.Element> | JSX.Element | null
  set: (
    cellEditorConfig: CellEditorConfig | null,
    cellEditorPlugins: Array<JSX.Element> | JSX.Element | null,
  ) => void
}

export type CellEditorConfig = Readonly<{
  namespace: string
  nodes?: ReadonlyArray<Klass<LexicalNode>>
  onError: (error: Error, editor: LexicalEditor) => void
  readOnly?: boolean
  theme?: EditorThemeClasses
}>

export const OPEN_TABLE_DRAWER_COMMAND: LexicalCommand<{}> = createCommand(
  'OPEN_EMBED_DRAWER_COMMAND',
)

export const CellContext = createContext<CellContextShape>({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
    // Empty
  },
})

export function TableContext({ children }: { children: JSX.Element }) {
  const [contextValue, setContextValue] = useState<{
    cellEditorConfig: CellEditorConfig | null
    cellEditorPlugins: Array<JSX.Element> | JSX.Element | null
  }>({
    cellEditorConfig: null,
    cellEditorPlugins: null,
  })
  return (
    <CellContext
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins })
          },
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins],
      )}
    >
      {children}
    </CellContext>
  )
}

export const TablePlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()
  const cellContext = use(CellContext)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null)
  const selectionRef = useRef<BaseSelection | null>(null)
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const rootElement = editor.getRootElement()
    if (rootElement) {
      const editorWrapper: HTMLElement | null =
        (rootElement.closest('.editor') as HTMLElement) ?? null
      setAnchorElem(editorWrapper ?? rootElement.parentElement)
    }
  }, [editor])

  useEffect(() => {
    if (!editor.hasNodes([TableNode, TableRowNode, TableCellNode])) {
      throw new Error(
        'TablePlugin: TableNode, TableRowNode, or TableCellNode is not registered on editor',
      )
    }

    return mergeRegister(
      editor.registerCommand(
        OPEN_TABLE_DRAWER_COMMAND,
        () => {
          const anchor = anchorElem
          if (!anchor) {
            return true
          }

          const anchorRect = anchor.getBoundingClientRect()
          let pos: { left: number; top: number } | null = null

          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selectionRef.current = selection.clone()

              const anchorNode = selection.anchor.getNode()
              const domElem = editor.getElementByKey(anchorNode.getKey())
              if (domElem) {
                const elemRect = domElem.getBoundingClientRect()
                if (elemRect.height > 0) {
                  pos = {
                    left: elemRect.left - anchorRect.left,
                    top: elemRect.bottom - anchorRect.top + 8,
                  }
                }
              }
            }
          })

          const nativeSelection = window.getSelection()
          if (nativeSelection && nativeSelection.rangeCount > 0) {
            const range = nativeSelection.getRangeAt(0)
            const rangeRect = range.getBoundingClientRect()
            if (rangeRect.height > 0) {
              pos = {
                left: rangeRect.left - anchorRect.left,
                top: rangeRect.bottom - anchorRect.top + 8,
              }
            }
          }

          // Fallback: position at start of editor
          if (!pos) {
            pos = { left: 0, top: 40 }
          }

          setPopupPosition(pos)
          setIsPopupOpen(true)
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [cellContext, editor, anchorElem])

  const handleClose = useCallback(() => {
    setIsPopupOpen(false)
  }, [])

  const handleInsert = useCallback(
    (cols: number, rows: number) => {
      setIsPopupOpen(false)
      editor.focus()
      editor.update(
        () => {
          if (selectionRef.current) {
            $setSelection(selectionRef.current.clone())
          }
        },
        { discrete: true, skipTransforms: true },
      )
      setTimeout(() => {
        editor.dispatchCommand(INSERT_TABLE_COMMAND, {
          columns: String(cols),
          rows: String(rows),
        })
      }, 1)
    },
    [editor],
  )

  return (
    <React.Fragment>
      <TableGridPopup
        anchorElem={anchorElem}
        editor={editor}
        isOpen={isPopupOpen}
        onClose={handleClose}
        onInsert={handleInsert}
        position={popupPosition}
      />
      <LexicalReactTablePlugin
        hasCellBackgroundColor={false}
        hasCellMerge
        hasHorizontalScroll={true}
      />
    </React.Fragment>
  )
}
