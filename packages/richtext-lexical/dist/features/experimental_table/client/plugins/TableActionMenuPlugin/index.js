'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $computeTableMapSkipCellCheck, $deleteTableColumnAtSelection, $deleteTableRowAtSelection, $getNodeTriplet, $getTableCellNodeFromLexicalNode, $getTableColumnIndexFromTableCellNode, $getTableNodeFromLexicalNodeOrThrow, $getTableRowIndexFromTableCellNode, $insertTableColumnAtSelection, $insertTableRowAtSelection, $isTableCellNode, $isTableSelection, $mergeCells, $unmergeCell, getTableElement, getTableObserverFromTableElement, TableCellHeaderStates, TableCellNode } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import { useScrollInfo } from '@payloadcms/ui';
import { $getSelection, $isElementNode, $isRangeSelection, $isTextNode, $setSelection, COMMAND_PRIORITY_CRITICAL, getDOMSelection, isDOMNode, SELECTION_CHANGE_COMMAND } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MeatballsIcon } from '../../../../../lexical/ui/icons/Meatballs/index.js';
function computeSelectionCount(selection) {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1
  };
}
function $canUnmerge() {
  const selection = $getSelection();
  if ($isRangeSelection(selection) && !selection.isCollapsed() || $isTableSelection(selection) && !selection.anchor.is(selection.focus) || !$isRangeSelection(selection) && !$isTableSelection(selection)) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}
function $selectLastDescendant(node) {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select();
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}
function TableActionMenu({
  cellMerge,
  contextRef,
  onClose,
  setIsMenuOpen,
  tableCellNode: _tableCellNode
}) {
  const [editor] = useLexicalComposerContext();
  const dropDownRef = useRef(null);
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1
  });
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const {
    y
  } = useScrollInfo();
  useEffect(() => {
    return editor.registerMutationListener(TableCellNode, nodeMutations => {
      const nodeUpdated = nodeMutations.get(tableCellNode.getKey()) === 'updated';
      if (nodeUpdated) {
        editor.getEditorState().read(() => {
          updateTableCellNode(tableCellNode.getLatest());
        });
      }
    }, {
      skipInitialization: true
    });
  }, [editor, tableCellNode]);
  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      // Merge cells
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        updateSelectionCounts(computeSelectionCount(selection));
        setCanMergeCells(currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1);
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor]);
  useEffect(() => {
    const menuButtonElement = contextRef.current;
    const dropDownElement = dropDownRef.current;
    const rootElement = editor.getRootElement();
    if (menuButtonElement != null && dropDownElement != null && rootElement != null) {
      const rootEleRect = rootElement.getBoundingClientRect();
      const menuButtonRect = menuButtonElement.getBoundingClientRect();
      dropDownElement.style.opacity = '1';
      const dropDownElementRect = dropDownElement.getBoundingClientRect();
      const margin = 5;
      let leftPosition = menuButtonRect.right + margin;
      if (leftPosition + dropDownElementRect.width > window.innerWidth || leftPosition + dropDownElementRect.width > rootEleRect.right) {
        const position = menuButtonRect.left - dropDownElementRect.width - margin;
        leftPosition = (position < 0 ? margin : position) + window.pageXOffset;
      }
      dropDownElement.style.left = `${leftPosition + window.pageXOffset}px`;
      let topPosition = menuButtonRect.top;
      if (topPosition + dropDownElementRect.height > window.innerHeight) {
        const position_0 = menuButtonRect.bottom - dropDownElementRect.height;
        topPosition = position_0 < 0 ? margin : position_0;
      }
      dropDownElement.style.top = `${topPosition}px`;
    }
  }, [contextRef, dropDownRef, editor, y]);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropDownRef.current != null && contextRef.current != null && isDOMNode(event.target) && !dropDownRef.current.contains(event.target) && !contextRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [setIsMenuOpen, contextRef]);
  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
        if (tableElement === null) {
          throw new Error('Expected to find tableElement in DOM');
        }
        const tableObserver = getTableObserverFromTableElement(tableElement);
        if (tableObserver !== null) {
          tableObserver.$clearHighlight();
        }
        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }
      $setSelection(null);
    });
  }, [editor, tableCellNode]);
  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection_0 = $getSelection();
      if (!$isTableSelection(selection_0)) {
        return;
      }
      const nodes = selection_0.getNodes();
      const tableCells = nodes.filter($isTableCellNode);
      const targetCell = $mergeCells(tableCells);
      if (targetCell) {
        $selectLastDescendant(targetCell);
        onClose();
      }
    });
  };
  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell();
    });
  };
  const insertTableRowAtSelection = useCallback(shouldInsertAfter => {
    editor.update(() => {
      for (let i = 0; i < selectionCounts.rows; i++) {
        $insertTableRowAtSelection(shouldInsertAfter);
      }
      onClose();
    });
  }, [editor, onClose, selectionCounts.rows]);
  const insertTableColumnAtSelection = useCallback(shouldInsertAfter_0 => {
    editor.update(() => {
      for (let i_0 = 0; i_0 < selectionCounts.columns; i_0++) {
        $insertTableColumnAtSelection(shouldInsertAfter_0);
      }
      onClose();
    });
  }, [editor, onClose, selectionCounts.columns]);
  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
      onClose();
    });
  }, [editor, onClose]);
  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode_0 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode_0.remove();
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
      onClose();
    });
  }, [editor, onClose]);
  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode_1 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
      const [gridMap] = $computeTableMapSkipCellCheck(tableNode_1, null, null);
      const rowCells = new Set();
      const newStyle = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;
      if (gridMap[tableRowIndex]) {
        for (let col = 0; col < gridMap[tableRowIndex].length; col++) {
          const mapCell = gridMap[tableRowIndex][col];
          if (!mapCell?.cell) {
            continue;
          }
          if (!rowCells.has(mapCell.cell)) {
            rowCells.add(mapCell.cell);
            mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
          }
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode_2 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      const tableColumnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
      const [gridMap_0] = $computeTableMapSkipCellCheck(tableNode_2, null, null);
      const columnCells = new Set();
      const newStyle_0 = tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;
      if (gridMap_0) {
        for (let row = 0; row < gridMap_0.length; row++) {
          const mapCell_0 = gridMap_0?.[row]?.[tableColumnIndex];
          if (!mapCell_0?.cell) {
            continue;
          }
          if (!columnCells.has(mapCell_0.cell)) {
            columnCells.add(mapCell_0.cell);
            mapCell_0.cell.setHeaderStyles(newStyle_0, TableCellHeaderStates.COLUMN);
          }
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleRowStriping = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode_3 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode_3) {
          tableNode_3.setRowStriping(!tableNode_3.getRowStriping());
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  const toggleFirstColumnFreeze = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode_4 = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode_4) {
          tableNode_4.setFrozenColumns(tableNode_4.getFrozenColumns() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);
  let mergeCellButton = null;
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = /*#__PURE__*/_jsx("button", {
        className: "item",
        "data-test-id": "table-merge-cells",
        onClick: () => mergeTableCellsAtSelection(),
        type: "button",
        children: /*#__PURE__*/_jsx("span", {
          className: "text",
          children: "Merge cells"
        })
      });
    } else if (canUnmergeCell) {
      mergeCellButton = /*#__PURE__*/_jsx("button", {
        className: "item",
        "data-test-id": "table-unmerge-cells",
        onClick: () => unmergeTableCellsAtSelection(),
        type: "button",
        children: /*#__PURE__*/_jsx("span", {
          className: "text",
          children: "Unmerge cells"
        })
      });
    }
  }
  return /*#__PURE__*/createPortal(
  // eslint-disable-next-line jsx-a11y/no-static-element-interactions,jsx-a11y/click-events-have-key-events
  /*#__PURE__*/
  _jsxs("div", {
    className: "table-action-menu-dropdown",
    onClick: e => {
      e.stopPropagation();
    },
    ref: dropDownRef,
    children: [mergeCellButton ? /*#__PURE__*/_jsxs(React.Fragment, {
      children: [mergeCellButton, /*#__PURE__*/_jsx("hr", {})]
    }) : null, /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-row-striping",
      onClick: () => toggleRowStriping(),
      type: "button",
      children: /*#__PURE__*/_jsx("span", {
        className: "text",
        children: "Toggle Row Striping"
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-freeze-first-column",
      onClick: () => toggleFirstColumnFreeze(),
      type: "button",
      children: /*#__PURE__*/_jsx("span", {
        className: "text",
        children: "Toggle First Column Freeze"
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-insert-row-above",
      onClick: () => insertTableRowAtSelection(false),
      type: "button",
      children: /*#__PURE__*/_jsxs("span", {
        className: "text",
        children: ["Insert ", selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`, " above"]
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-insert-row-below",
      onClick: () => insertTableRowAtSelection(true),
      type: "button",
      children: /*#__PURE__*/_jsxs("span", {
        className: "text",
        children: ["Insert ", selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`, " below"]
      })
    }), /*#__PURE__*/_jsx("hr", {}), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-insert-column-before",
      onClick: () => insertTableColumnAtSelection(false),
      type: "button",
      children: /*#__PURE__*/_jsxs("span", {
        className: "text",
        children: ["Insert ", selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`, ' ', "left"]
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-insert-column-after",
      onClick: () => insertTableColumnAtSelection(true),
      type: "button",
      children: /*#__PURE__*/_jsxs("span", {
        className: "text",
        children: ["Insert ", selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns`, ' ', "right"]
      })
    }), /*#__PURE__*/_jsx("hr", {}), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-delete-columns",
      onClick: () => deleteTableColumnAtSelection(),
      type: "button",
      children: /*#__PURE__*/_jsx("span", {
        className: "text",
        children: "Delete column"
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-delete-rows",
      onClick: () => deleteTableRowAtSelection(),
      type: "button",
      children: /*#__PURE__*/_jsx("span", {
        className: "text",
        children: "Delete row"
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-delete",
      onClick: () => deleteTableAtSelection(),
      type: "button",
      children: /*#__PURE__*/_jsx("span", {
        className: "text",
        children: "Delete table"
      })
    }), /*#__PURE__*/_jsx("hr", {}), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-row-header",
      onClick: () => toggleTableRowIsHeader(),
      type: "button",
      children: /*#__PURE__*/_jsxs("span", {
        className: "text",
        children: [(tableCellNode.__headerState & TableCellHeaderStates.ROW) === TableCellHeaderStates.ROW ? 'Remove' : 'Add', ' ', "row header"]
      })
    }), /*#__PURE__*/_jsx("button", {
      className: "item",
      "data-test-id": "table-column-header",
      onClick: () => toggleTableColumnIsHeader(),
      type: "button",
      children: /*#__PURE__*/_jsxs("span", {
        className: "text",
        children: [(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) === TableCellHeaderStates.COLUMN ? 'Remove' : 'Add', ' ', "column header"]
      })
    })]
  }), document.body);
}
function TableCellActionMenuContainer({
  anchorElem,
  cellMerge
}) {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef(null);
  const menuRootRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tableCellNode, setTableMenuCellNode] = useState(null);
  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;
    function disable() {
      if (menu) {
        menu.classList.remove('table-cell-action-button-container--active');
        menu.classList.add('table-cell-action-button-container--inactive');
      }
      setTableMenuCellNode(null);
    }
    if (selection == null || menu == null) {
      return disable();
    }
    const rootElement = editor.getRootElement();
    let tableObserver = null;
    let tableCellParentNodeDOM = null;
    if ($isRangeSelection(selection) && rootElement !== null && nativeSelection !== null && rootElement.contains(nativeSelection.anchorNode)) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (tableCellNodeFromSelection == null) {
        return disable();
      }
      tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey());
      if (tableCellParentNodeDOM == null || !tableCellNodeFromSelection.isAttached()) {
        return disable();
      }
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNodeFromSelection);
      const tableElement = getTableElement(tableNode, editor.getElementByKey(tableNode.getKey()));
      if (tableElement === null) {
        throw new Error('TableActionMenu: Expected to find tableElement in DOM');
      }
      tableObserver = getTableObserverFromTableElement(tableElement);
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ($isTableSelection(selection)) {
      const anchorNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      if (!$isTableCellNode(anchorNode)) {
        throw new Error('TableSelection anchorNode must be a TableCellNode');
      }
      const tableNode_0 = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
      const tableElement_0 = getTableElement(tableNode_0, editor.getElementByKey(tableNode_0.getKey()));
      if (tableElement_0 === null) {
        throw new Error('TableActionMenu: Expected to find tableElement in DOM');
      }
      tableObserver = getTableObserverFromTableElement(tableElement_0);
      tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());
    } else if (!activeElement) {
      return disable();
    }
    if (tableObserver === null || tableCellParentNodeDOM === null) {
      return disable();
    }
    const enabled = !tableObserver || !tableObserver.isSelecting;
    menu.classList.toggle('table-cell-action-button-container--active', enabled);
    menu.classList.toggle('table-cell-action-button-container--inactive', !enabled);
    if (enabled) {
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = tableCellRect.top - anchorRect.top;
      const left = tableCellRect.right - anchorRect.left;
      menu.style.transform = `translate(${left}px, ${top}px)`;
    }
  }, [editor, anchorElem]);
  useEffect(() => {
    // We call the $moveMenu callback every time the selection changes,
    // once up front, and once after each pointerup
    let timeoutId = undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($moveMenu);
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };
    return mergeRegister(editor.registerUpdateListener(delayedCallback), editor.registerCommand(SELECTION_CHANGE_COMMAND, delayedCallback, COMMAND_PRIORITY_CRITICAL), editor.registerRootListener((rootElement_0, prevRootElement) => {
      if (prevRootElement) {
        prevRootElement.removeEventListener('pointerup', delayedCallback);
      }
      if (rootElement_0) {
        rootElement_0.addEventListener('pointerup', delayedCallback);
        delayedCallback();
      }
    }), () => clearTimeout(timeoutId));
  });
  const prevTableCellDOM = useRef(tableCellNode);
  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellDOM.current = tableCellNode;
  }, [prevTableCellDOM, tableCellNode]);
  return /*#__PURE__*/_jsx("div", {
    className: "table-cell-action-button-container",
    ref: menuButtonRef,
    children: tableCellNode != null && /*#__PURE__*/_jsxs(React.Fragment, {
      children: [/*#__PURE__*/_jsx("button", {
        className: "table-cell-action-button",
        onClick: e => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        },
        ref: menuRootRef,
        type: "button",
        children: /*#__PURE__*/_jsx(MeatballsIcon, {})
      }), isMenuOpen && /*#__PURE__*/_jsx(TableActionMenu, {
        cellMerge: cellMerge,
        contextRef: menuRootRef,
        onClose: () => setIsMenuOpen(false),
        setIsMenuOpen: setIsMenuOpen,
        tableCellNode: tableCellNode
      })]
    })
  });
}
export const TableActionMenuPlugin = t0 => {
  const $ = _c(3);
  const {
    anchorElem
  } = t0;
  const isEditable = useLexicalEditable();
  let t1;
  if ($[0] !== anchorElem || $[1] !== isEditable) {
    t1 = createPortal(isEditable ? _jsx(TableCellActionMenuContainer, {
      anchorElem: anchorElem ?? document.body,
      cellMerge: true
    }) : null, anchorElem ?? document.body);
    $[0] = anchorElem;
    $[1] = isEditable;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
//# sourceMappingURL=index.js.map