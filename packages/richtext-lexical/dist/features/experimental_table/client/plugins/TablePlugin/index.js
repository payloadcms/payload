'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TablePlugin as LexicalReactTablePlugin } from '@lexical/react/LexicalTablePlugin';
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { formatDrawerSlug, useEditDepth } from '@payloadcms/ui';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, createCommand } from 'lexical';
import { createContext, use, useEffect, useMemo, useState } from 'react';
import * as React from 'react';
import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js';
import { FieldsDrawer } from '../../../../../utilities/fieldsDrawer/Drawer.js';
import { useLexicalDrawer } from '../../../../../utilities/fieldsDrawer/useLexicalDrawer.js';
export const OPEN_TABLE_DRAWER_COMMAND = createCommand('OPEN_EMBED_DRAWER_COMMAND');
export const CellContext = /*#__PURE__*/createContext({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
    // Empty
  }
});
export function TableContext({
  children
}) {
  const [contextValue, setContextValue] = useState({
    cellEditorConfig: null,
    cellEditorPlugins: null
  });
  return /*#__PURE__*/_jsx(CellContext, {
    value: useMemo(() => ({
      cellEditorConfig: contextValue.cellEditorConfig,
      cellEditorPlugins: contextValue.cellEditorPlugins,
      set: (cellEditorConfig, cellEditorPlugins) => {
        setContextValue({
          cellEditorConfig,
          cellEditorPlugins
        });
      }
    }), [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]),
    children: children
  });
}
export const TablePlugin = () => {
  const $ = _c(16);
  const [editor] = useLexicalComposerContext();
  const cellContext = use(CellContext);
  const editDepth = useEditDepth();
  const {
    fieldProps: t0,
    uuid
  } = useEditorConfigContext();
  const {
    schemaPath
  } = t0;
  const t1 = "lexical-table-create-" + uuid;
  let t2;
  if ($[0] !== editDepth || $[1] !== t1) {
    t2 = formatDrawerSlug({
      slug: t1,
      depth: editDepth
    });
    $[0] = editDepth;
    $[1] = t1;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const drawerSlug = t2;
  const {
    toggleDrawer
  } = useLexicalDrawer(drawerSlug, true);
  let t3;
  if ($[3] !== editor || $[4] !== toggleDrawer) {
    t3 = () => {
      if (!editor.hasNodes([TableNode, TableRowNode, TableCellNode])) {
        throw new Error("TablePlugin: TableNode, TableRowNode, or TableCellNode is not registered on editor");
      }
      return mergeRegister(editor.registerCommand(OPEN_TABLE_DRAWER_COMMAND, () => {
        let rangeSelection = null;
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            rangeSelection = selection;
          }
        });
        if (rangeSelection) {
          toggleDrawer();
        }
        return true;
      }, COMMAND_PRIORITY_EDITOR));
    };
    $[3] = editor;
    $[4] = toggleDrawer;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== cellContext || $[7] !== editor || $[8] !== toggleDrawer) {
    t4 = [cellContext, editor, toggleDrawer];
    $[6] = cellContext;
    $[7] = editor;
    $[8] = toggleDrawer;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  useEffect(t3, t4);
  let t5;
  if ($[10] !== editor) {
    t5 = (_fields, data) => {
      if (!data.columns || !data.rows) {
        return;
      }
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        columns: String(data.columns),
        rows: String(data.rows)
      });
    };
    $[10] = editor;
    $[11] = t5;
  } else {
    t5 = $[11];
  }
  let t6;
  if ($[12] !== drawerSlug || $[13] !== schemaPath || $[14] !== t5) {
    t6 = _jsxs(React.Fragment, {
      children: [_jsx(FieldsDrawer, {
        drawerSlug,
        drawerTitle: "Create Table",
        featureKey: "experimental_table",
        handleDrawerSubmit: t5,
        schemaPath,
        schemaPathSuffix: "fields"
      }), _jsx(LexicalReactTablePlugin, {
        hasCellBackgroundColor: false,
        hasCellMerge: true,
        hasHorizontalScroll: true
      })]
    });
    $[12] = drawerSlug;
    $[13] = schemaPath;
    $[14] = t5;
    $[15] = t6;
  } else {
    t6 = $[15];
  }
  return t6;
};
//# sourceMappingURL=index.js.map