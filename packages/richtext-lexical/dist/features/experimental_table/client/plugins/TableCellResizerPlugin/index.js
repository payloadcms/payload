'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $computeTableMapSkipCellCheck, $getTableNodeFromLexicalNodeOrThrow, $getTableRowIndexFromTableCellNode, $isTableCellNode, $isTableRowNode, getDOMCellFromTarget, getTableElement, TableNode } from '@lexical/table';
import { calculateZoomLevel, mergeRegister } from '@lexical/utils';
import { $getNearestNodeFromDOMNode, isHTMLElement, SKIP_SCROLL_INTO_VIEW_TAG } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorConfigContext } from '../../../../../lexical/config/client/EditorConfigProvider.js';
const MIN_ROW_HEIGHT = 33;
const MIN_COLUMN_WIDTH = 92;
function TableCellResizer({
  editor
}) {
  const targetRef = useRef(null);
  const resizerRef = useRef(null);
  const tableRectRef = useRef(null);
  const [hasTable, setHasTable] = useState(false);
  const editorConfig = useEditorConfigContext();
  const mouseStartPosRef = useRef(null);
  const [mouseCurrentPos, updateMouseCurrentPos] = useState(null);
  const [activeCell, updateActiveCell] = useState(null);
  const [isMouseDown, updateIsMouseDown] = useState(false);
  const [draggingDirection, updateDraggingDirection] = useState(null);
  const resetState = useCallback(() => {
    updateActiveCell(null);
    targetRef.current = null;
    updateDraggingDirection(null);
    mouseStartPosRef.current = null;
    tableRectRef.current = null;
  }, []);
  const isMouseDownOnEvent = event => {
    return (event.buttons & 1) === 1;
  };
  useEffect(() => {
    const tableKeys = new Set();
    return mergeRegister(editor.registerMutationListener(TableNode, nodeMutations => {
      for (const [nodeKey, mutation] of nodeMutations) {
        if (mutation === 'destroyed') {
          tableKeys.delete(nodeKey);
        } else {
          tableKeys.add(nodeKey);
        }
      }
      setHasTable(tableKeys.size > 0);
    }), editor.registerNodeTransform(TableNode, tableNode => {
      if (tableNode.getColWidths()) {
        return tableNode;
      }
      const numColumns = tableNode.getColumnCount();
      const columnWidth = MIN_COLUMN_WIDTH;
      tableNode.setColWidths(Array(numColumns).fill(columnWidth));
      return tableNode;
    }));
  }, [editor]);
  useEffect(() => {
    if (!hasTable) {
      return;
    }
    const onMouseMove = event_0 => {
      const target = event_0.target;
      if (!isHTMLElement(target)) {
        return;
      }
      if (draggingDirection) {
        updateMouseCurrentPos({
          x: event_0.clientX,
          y: event_0.clientY
        });
        return;
      }
      updateIsMouseDown(isMouseDownOnEvent(event_0));
      if (resizerRef.current && resizerRef.current.contains(target)) {
        return;
      }
      if (targetRef.current !== target) {
        targetRef.current = target;
        const cell = getDOMCellFromTarget(target);
        if (cell && activeCell !== cell) {
          editor.getEditorState().read(() => {
            const tableCellNode = $getNearestNodeFromDOMNode(cell.elem);
            if (!tableCellNode) {
              throw new Error('TableCellResizer: Table cell node not found.');
            }
            const tableNode_0 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
            const tableElement = getTableElement(tableNode_0, editor.getElementByKey(tableNode_0.getKey()));
            if (!tableElement) {
              throw new Error('TableCellResizer: Table element not found.');
            }
            targetRef.current = target;
            tableRectRef.current = tableElement.getBoundingClientRect();
            updateActiveCell(cell);
          }, {
            editor
          });
        } else if (cell == null) {
          resetState();
        }
      }
    };
    const onMouseDown = event_1 => {
      updateIsMouseDown(true);
    };
    const onMouseUp = event_2 => {
      updateIsMouseDown(false);
    };
    const removeRootListener = editor.registerRootListener((rootElement, prevRootElement) => {
      prevRootElement?.removeEventListener('mousemove', onMouseMove);
      prevRootElement?.removeEventListener('mousedown', onMouseDown);
      prevRootElement?.removeEventListener('mouseup', onMouseUp);
      rootElement?.addEventListener('mousemove', onMouseMove);
      rootElement?.addEventListener('mousedown', onMouseDown);
      rootElement?.addEventListener('mouseup', onMouseUp);
    });
    return () => {
      removeRootListener();
    };
  }, [activeCell, draggingDirection, editor, hasTable, resetState]);
  const isHeightChanging = direction => {
    if (direction === 'bottom') {
      return true;
    }
    return false;
  };
  const updateRowHeight = useCallback(heightChange => {
    if (!activeCell) {
      throw new Error('TableCellResizer: Expected active cell.');
    }
    editor.update(() => {
      const tableCellNode_0 = $getNearestNodeFromDOMNode(activeCell.elem);
      if (!$isTableCellNode(tableCellNode_0)) {
        throw new Error('TableCellResizer: Table cell node not found.');
      }
      const tableNode_1 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode_0);
      const baseRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode_0);
      const tableRows = tableNode_1.getChildren();
      // Determine if this is a full row merge by checking colspan
      const isFullRowMerge = tableCellNode_0.getColSpan() === tableNode_1.getColumnCount();
      // For full row merges, apply to first row. For partial merges, apply to last row
      const tableRowIndex = isFullRowMerge ? baseRowIndex : baseRowIndex + tableCellNode_0.getRowSpan() - 1;
      if (tableRowIndex >= tableRows.length || tableRowIndex < 0) {
        throw new Error('Expected table cell to be inside of table row.');
      }
      const tableRow = tableRows[tableRowIndex];
      if (!$isTableRowNode(tableRow)) {
        throw new Error('Expected table row');
      }
      let height = tableRow.getHeight();
      if (height === undefined) {
        const rowCells = tableRow.getChildren();
        height = Math.min(...rowCells.map(cell_0 => getCellNodeHeight(cell_0, editor) ?? Infinity));
      }
      const newHeight = Math.max(height + heightChange, MIN_ROW_HEIGHT);
      tableRow.setHeight(newHeight);
    }, {
      tag: SKIP_SCROLL_INTO_VIEW_TAG
    });
  }, [activeCell, editor]);
  const getCellNodeHeight = (cell_1, activeEditor) => {
    const domCellNode = activeEditor.getElementByKey(cell_1.getKey());
    return domCellNode?.clientHeight;
  };
  const getCellColumnIndex = (tableCellNode_1, tableMap) => {
    let columnIndex;
    tableMap.forEach(row => {
      row.forEach((cell_2, columnIndexInner) => {
        if (cell_2.cell === tableCellNode_1) {
          columnIndex = columnIndexInner;
        }
      });
    });
    return columnIndex;
  };
  const updateColumnWidth = useCallback(widthChange => {
    if (!activeCell) {
      throw new Error('TableCellResizer: Expected active cell.');
    }
    editor.update(() => {
      const tableCellNode_2 = $getNearestNodeFromDOMNode(activeCell.elem);
      if (!$isTableCellNode(tableCellNode_2)) {
        throw new Error('TableCellResizer: Table cell node not found.');
      }
      const tableNode_2 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode_2);
      const [tableMap_0] = $computeTableMapSkipCellCheck(tableNode_2, null, null);
      const columnIndex_0 = getCellColumnIndex(tableCellNode_2, tableMap_0);
      if (columnIndex_0 === undefined) {
        throw new Error('TableCellResizer: Table column not found.');
      }
      const colWidths = tableNode_2.getColWidths();
      if (!colWidths) {
        return;
      }
      const width = colWidths[columnIndex_0];
      if (width === undefined) {
        return;
      }
      const newColWidths = [...colWidths];
      const newWidth = Math.max(width + widthChange, MIN_COLUMN_WIDTH);
      newColWidths[columnIndex_0] = newWidth;
      tableNode_2.setColWidths(newColWidths);
    }, {
      tag: SKIP_SCROLL_INTO_VIEW_TAG
    });
  }, [activeCell, editor]);
  const mouseUpHandler = useCallback(direction_0 => {
    const handler = event_3 => {
      event_3.preventDefault();
      event_3.stopPropagation();
      if (!activeCell) {
        throw new Error('TableCellResizer: Expected active cell.');
      }
      if (mouseStartPosRef.current) {
        const {
          x,
          y
        } = mouseStartPosRef.current;
        if (activeCell === null) {
          return;
        }
        const zoom = calculateZoomLevel(event_3.target);
        if (isHeightChanging(direction_0)) {
          const heightChange_0 = (event_3.clientY - y) / zoom;
          updateRowHeight(heightChange_0);
        } else {
          const widthChange_0 = (event_3.clientX - x) / zoom;
          updateColumnWidth(widthChange_0);
        }
        resetState();
        document.removeEventListener('mouseup', handler);
      }
    };
    return handler;
  }, [activeCell, resetState, updateColumnWidth, updateRowHeight]);
  const toggleResize = useCallback(direction_1 => event_4 => {
    event_4.preventDefault();
    event_4.stopPropagation();
    if (!activeCell) {
      throw new Error('TableCellResizer: Expected active cell.');
    }
    mouseStartPosRef.current = {
      x: event_4.clientX,
      y: event_4.clientY
    };
    updateMouseCurrentPos(mouseStartPosRef.current);
    updateDraggingDirection(direction_1);
    document.addEventListener('mouseup', mouseUpHandler(direction_1));
  }, [activeCell, mouseUpHandler]);
  const [resizerStyles, setResizerStyles] = useState({
    bottom: null,
    left: null,
    right: null,
    top: null
  });
  useEffect(() => {
    if (activeCell) {
      const {
        height: height_0,
        left,
        top,
        width: width_0
      } = activeCell.elem.getBoundingClientRect();
      const zoom_0 = calculateZoomLevel(activeCell.elem);
      const zoneWidth = 10 // Pixel width of the zone where you can drag the edge
      ;
      const styles = {
        bottom: {
          backgroundColor: 'none',
          cursor: 'row-resize',
          height: `${zoneWidth}px`,
          left: `${window.scrollX + left}px`,
          top: `${window.scrollY + top + height_0 - zoneWidth / 2}px`,
          width: `${width_0}px`
        },
        right: {
          backgroundColor: 'none',
          cursor: 'col-resize',
          height: `${height_0}px`,
          left: `${window.scrollX + left + width_0 - zoneWidth / 2}px`,
          top: `${window.scrollY + top}px`,
          width: `${zoneWidth}px`
        }
      };
      const tableRect = tableRectRef.current;
      if (draggingDirection && mouseCurrentPos && tableRect) {
        if (isHeightChanging(draggingDirection)) {
          styles[draggingDirection].left = `${window.scrollX + tableRect.left}px`;
          styles[draggingDirection].top = `${window.scrollY + mouseCurrentPos.y / zoom_0}px`;
          styles[draggingDirection].height = '3px';
          styles[draggingDirection].width = `${tableRect.width}px`;
        } else {
          styles[draggingDirection].top = `${window.scrollY + tableRect.top}px`;
          styles[draggingDirection].left = `${window.scrollX + mouseCurrentPos.x / zoom_0}px`;
          styles[draggingDirection].width = '3px';
          styles[draggingDirection].height = `${tableRect.height}px`;
        }
        styles[draggingDirection].backgroundColor = '#adf';
      }
      setResizerStyles(styles);
    } else {
      setResizerStyles({
        bottom: null,
        left: null,
        right: null,
        top: null
      });
    }
  }, [activeCell, draggingDirection, mouseCurrentPos]);
  return /*#__PURE__*/_jsx("div", {
    ref: resizerRef,
    children: activeCell != null && !isMouseDown && /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx("div", {
        className: `${editorConfig.editorConfig.lexical.theme.tableCellResizer} TableCellResizer__ui`,
        onMouseDown: toggleResize('right'),
        style: resizerStyles.right || undefined
      }), /*#__PURE__*/_jsx("div", {
        className: `${editorConfig.editorConfig.lexical.theme.tableCellResizer} TableCellResizer__ui`,
        onMouseDown: toggleResize('bottom'),
        style: resizerStyles.bottom || undefined
      })]
    })
  });
}
export const TableCellResizerPlugin = () => {
  const $ = _c(3);
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  let t0;
  if ($[0] !== editor || $[1] !== isEditable) {
    t0 = isEditable ? createPortal(_jsx(TableCellResizer, {
      editor
    }), document.body) : null;
    $[0] = editor;
    $[1] = isEditable;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
};
//# sourceMappingURL=index.js.map