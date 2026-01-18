'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $getTableAndElementByKey, $getTableColumnIndexFromTableCellNode, $getTableRowIndexFromTableCellNode, $insertTableColumnAtSelection, $insertTableRowAtSelection, $isTableCellNode, $isTableNode, getTableElement, TableNode } from '@lexical/table';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { $getNearestNodeFromDOMNode, isHTMLElement } from 'lexical';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js';
import { useDebounce } from '../../utils/useDebounce.js';
const BUTTON_WIDTH_PX = 20;
function TableHoverActionsContainer({
  anchorElem
}) {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const editorConfig = useEditorConfigContext();
  const [isShownRow, setShownRow] = useState(false);
  const [isShownColumn, setShownColumn] = useState(false);
  const [shouldListenMouseMove, setShouldListenMouseMove] = useState(false);
  const [position, setPosition] = useState({});
  const tableSetRef = useRef(new Set());
  const tableCellDOMNodeRef = useRef(null);
  const debouncedOnMouseMove = useDebounce(event => {
    const {
      isOutside,
      tableDOMNode
    } = getMouseInfo(event, editorConfig.editorConfig?.lexical);
    if (isOutside) {
      setShownRow(false);
      setShownColumn(false);
      return;
    }
    if (!tableDOMNode) {
      return;
    }
    tableCellDOMNodeRef.current = tableDOMNode;
    let hoveredRowNode = null;
    let hoveredColumnNode = null;
    let tableDOMElement = null;
    editor.getEditorState().read(() => {
      const maybeTableCell = $getNearestNodeFromDOMNode(tableDOMNode);
      if ($isTableCellNode(maybeTableCell)) {
        const table = $findMatchingParent(maybeTableCell, node => $isTableNode(node));
        if (!$isTableNode(table)) {
          return;
        }
        tableDOMElement = getTableElement(table, editor.getElementByKey(table.getKey()));
        if (tableDOMElement) {
          const rowCount = table.getChildrenSize();
          const colCount = table.getChildAtIndex(0)?.getChildrenSize();
          const rowIndex = $getTableRowIndexFromTableCellNode(maybeTableCell);
          const colIndex = $getTableColumnIndexFromTableCellNode(maybeTableCell);
          if (rowIndex === rowCount - 1) {
            hoveredRowNode = maybeTableCell;
          } else if (colIndex === colCount - 1) {
            hoveredColumnNode = maybeTableCell;
          }
        }
      }
    }, {
      editor
    });
    if (!tableDOMElement) {
      return;
    }
    // this is the scrollable div container of the table (in case of overflow)
    const tableContainerElement = tableDOMElement.parentElement;
    if (!tableContainerElement) {
      return;
    }
    const {
      bottom: tableElemBottom,
      height: tableElemHeight,
      left: tableElemLeft,
      right: tableElemRight,
      width: tableElemWidth,
      y: tableElemY
    } = tableDOMElement.getBoundingClientRect();
    let tableHasScroll = false;
    if (tableContainerElement && tableContainerElement.classList.contains('LexicalEditorTheme__tableScrollableWrapper')) {
      tableHasScroll = tableContainerElement.scrollWidth > tableContainerElement.clientWidth;
    }
    const {
      left: editorElemLeft,
      y: editorElemY
    } = anchorElem.getBoundingClientRect();
    if (hoveredRowNode) {
      setShownColumn(false);
      setShownRow(true);
      setPosition({
        height: BUTTON_WIDTH_PX,
        left: tableHasScroll && tableContainerElement ? tableContainerElement.offsetLeft : tableElemLeft - editorElemLeft,
        top: tableElemBottom - editorElemY + 5,
        width: tableHasScroll && tableContainerElement ? tableContainerElement.offsetWidth : tableElemWidth
      });
    } else if (hoveredColumnNode) {
      setShownColumn(true);
      setShownRow(false);
      setPosition({
        height: tableElemHeight,
        left: tableElemRight - editorElemLeft + 5,
        top: tableElemY - editorElemY,
        width: BUTTON_WIDTH_PX
      });
    }
  }, 50, 250);
  // Hide the buttons on any table dimensions change to prevent last row cells
  // overlap behind the 'Add Row' button when text entry changes cell height
  const tableResizeObserver = useMemo(() => {
    return new ResizeObserver(() => {
      setShownRow(false);
      setShownColumn(false);
    });
  }, []);
  useEffect(() => {
    if (!shouldListenMouseMove) {
      return;
    }
    document.addEventListener('mousemove', debouncedOnMouseMove);
    return () => {
      setShownRow(false);
      setShownColumn(false);
      document.removeEventListener('mousemove', debouncedOnMouseMove);
    };
  }, [shouldListenMouseMove, debouncedOnMouseMove]);
  useEffect(() => {
    return mergeRegister(editor.registerMutationListener(TableNode, mutations => {
      editor.getEditorState().read(() => {
        let resetObserver = false;
        for (const [key, type] of mutations) {
          switch (type) {
            case 'created':
              {
                tableSetRef.current.add(key);
                resetObserver = true;
                break;
              }
            case 'destroyed':
              {
                tableSetRef.current.delete(key);
                resetObserver = true;
                break;
              }
            default:
              break;
          }
        }
        if (resetObserver) {
          // Reset resize observers
          tableResizeObserver.disconnect();
          for (const tableKey of tableSetRef.current) {
            const {
              tableElement
            } = $getTableAndElementByKey(tableKey);
            tableResizeObserver.observe(tableElement);
          }
          setShouldListenMouseMove(tableSetRef.current.size > 0);
        }
      }, {
        editor
      });
    }, {
      skipInitialization: false
    }));
  }, [editor, tableResizeObserver]);
  const insertAction = insertRow => {
    editor.update(() => {
      if (tableCellDOMNodeRef.current) {
        const maybeTableNode = $getNearestNodeFromDOMNode(tableCellDOMNodeRef.current);
        maybeTableNode?.selectEnd();
        if (insertRow) {
          $insertTableRowAtSelection();
          setShownRow(false);
        } else {
          $insertTableColumnAtSelection();
          setShownColumn(false);
        }
      }
    });
  };
  if (!isEditable) {
    return null;
  }
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [isShownRow && /*#__PURE__*/_jsx("button", {
      "aria-label": "Add Row",
      className: editorConfig.editorConfig.lexical.theme.tableAddRows,
      onClick: () => insertAction(true),
      style: {
        ...position
      },
      type: "button"
    }), isShownColumn && /*#__PURE__*/_jsx("button", {
      "aria-label": "Add Column",
      className: editorConfig.editorConfig.lexical.theme.tableAddColumns,
      onClick: () => insertAction(false),
      style: {
        ...position
      },
      type: "button"
    })]
  });
}
function getMouseInfo(event, editorConfig) {
  const target = event.target;
  if (isHTMLElement(target)) {
    const tableDOMNode = target.closest(`td.${editorConfig.theme.tableCell}, th.${editorConfig.theme.tableCell}`);
    const isOutside = !(tableDOMNode || target.closest(`button.${editorConfig.theme.tableAddRows}`) || target.closest(`button.${editorConfig.theme.tableAddColumns}`) || target.closest(`div.${editorConfig.theme.tableCellResizer}`));
    return {
      isOutside,
      tableDOMNode
    };
  } else {
    return {
      isOutside: true,
      tableDOMNode: null
    };
  }
}
export function TableHoverActionsPlugin(t0) {
  const $ = _c(2);
  const {
    anchorElem: t1
  } = t0;
  const anchorElem = t1 === undefined ? document.body : t1;
  const isEditable = useLexicalEditable();
  if (!isEditable) {
    return null;
  }
  let t2;
  if ($[0] !== anchorElem) {
    t2 = createPortal(_jsx(TableHoverActionsContainer, {
      anchorElem
    }), anchorElem);
    $[0] = anchorElem;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  return t2;
}
//# sourceMappingURL=index.js.map