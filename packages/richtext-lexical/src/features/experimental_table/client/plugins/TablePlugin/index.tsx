'use client'

import type {
  EditorThemeClasses,
  Klass,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
} from 'lexical'
import type { JsonObject } from 'payload'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TablePlugin as LexicalReactTablePlugin } from '@lexical/react/LexicalTablePlugin'
import { INSERT_TABLE_COMMAND, TableNode } from '@lexical/table'
import { mergeRegister } from '@lexical/utils'
import { formatDrawerSlug, useDrawerDepth, useModal } from '@payloadcms/ui'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as React from 'react'

import type { PluginComponent } from '../../../../typesClient.js'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import { FieldsDrawer } from '../../../../../utilities/fieldsDrawer/Drawer.js'
import './index.scss'

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

export const OPEN_TABLE_DRAWER_COMMAND: LexicalCommand<JsonObject> = createCommand(
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
    <CellContext.Provider
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
    </CellContext.Provider>
  )
}

export const TablePlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext()
  const cellContext = useContext(CellContext)
  const { closeModal, toggleModal } = useModal()
  const drawerDepth = useDrawerDepth()
  const { uuid } = useEditorConfigContext()

  const drawerSlug = formatDrawerSlug({
    slug: 'lexical-table-create-' + uuid,
    depth: drawerDepth,
  })

  useEffect(() => {
    if (!editor.hasNodes([TableNode])) {
      throw new Error('TablePlugin: TableNode is not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand(
        OPEN_TABLE_DRAWER_COMMAND,
        () => {
          let rangeSelection: null | RangeSelection = null

          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              rangeSelection = selection
            }
          })

          if (rangeSelection) {
            toggleModal(drawerSlug)
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [cellContext, editor, toggleModal, drawerSlug])

  return (
    <React.Fragment>
      <FieldsDrawer
        drawerSlug={drawerSlug}
        drawerTitle="Create Table"
        featureKey="experimental_table"
        handleDrawerSubmit={(_fields, data) => {
          closeModal(drawerSlug)

          if (!data.columns || !data.rows) {
            return
          }

          editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns: String(data.columns),
            rows: String(data.rows),
          })
        }}
        schemaPathSuffix="fields"
      />
      <LexicalReactTablePlugin hasCellBackgroundColor={false} hasCellMerge />
    </React.Fragment>
  )
}
