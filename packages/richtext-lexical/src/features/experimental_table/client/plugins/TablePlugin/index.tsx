'use client'

import type {
  EditorThemeClasses,
  Klass,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  RangeSelection,
} from 'lexical'
import type { JSX } from 'react'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TablePlugin as LexicalReactTablePlugin } from '@lexical/react/LexicalTablePlugin'
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { mergeRegister } from '@lexical/utils'
import { formatDrawerSlug, useEditDepth } from '@payloadcms/ui'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical'
import { createContext, use, useEffect, useMemo, useState } from 'react'
import * as React from 'react'

import type { PluginComponent } from '../../../../typesClient.js'

import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js'
import { FieldsDrawer } from '../../../../../utilities/fieldsDrawer/Drawer.js'
import { useLexicalDrawer } from '../../../../../utilities/fieldsDrawer/useLexicalDrawer.js'
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
  const editDepth = useEditDepth()
  const {
    fieldProps: { schemaPath },
    uuid,
  } = useEditorConfigContext()

  const drawerSlug = formatDrawerSlug({
    slug: 'lexical-table-create-' + uuid,
    depth: editDepth,
  })
  const { toggleDrawer } = useLexicalDrawer(drawerSlug, true)

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
          let rangeSelection: null | RangeSelection = null

          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isRangeSelection(selection)) {
              rangeSelection = selection
            }
          })

          if (rangeSelection) {
            toggleDrawer()
          }
          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    )
  }, [cellContext, editor, toggleDrawer])

  return (
    <React.Fragment>
      <FieldsDrawer
        drawerSlug={drawerSlug}
        drawerTitle="Create Table"
        featureKey="experimental_table"
        handleDrawerSubmit={(_fields, data) => {
          if (!data.columns || !data.rows) {
            return
          }

          editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            columns: String(data.columns),
            rows: String(data.rows),
          })
        }}
        schemaPath={schemaPath}
        schemaPathSuffix="fields"
      />
      <LexicalReactTablePlugin
        hasCellBackgroundColor={false}
        hasCellMerge
        hasHorizontalScroll={true}
      />
    </React.Fragment>
  )
}
