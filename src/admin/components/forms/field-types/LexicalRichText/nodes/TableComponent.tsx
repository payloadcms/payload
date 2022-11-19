/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { RangeSelection, TextFormatType } from 'lexical';

import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $insertGeneratedNodes,
} from '@lexical/clipboard';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $addUpdateTag,
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  createEditor,
  CUT_COMMAND,
  EditorThemeClasses,
  FORMAT_TEXT_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  LexicalEditor,
  NodeKey,
  PASTE_COMMAND,
} from 'lexical';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { IS_APPLE } from '../shared/environment';

import { CellContext } from '../plugins/TablePlugin';
import {
  $isTableNode,
  Cell,
  cellHTMLCache,
  cellTextContentCache,
  createRow,
  createUID,
  exportTableCellsToHTML,
  extractRowsFromHTML,
  Rows,
  TableNode,
} from './TableNode';

type SortOptions = {type: 'ascending' | 'descending'; x: number};

const NO_CELLS: [] = [];

function $createSelectAll(): RangeSelection {
  const sel = $createRangeSelection();
  sel.focus.set('root', $getRoot().getChildrenSize(), 'element');
  return sel;
}

function createEmptyParagraphHTML(theme: EditorThemeClasses): string {
  return `<p class="${theme.paragraph}"><br></p>`;
}

function focusCell(tableElem: HTMLElement, id: string): void {
  const cellElem = tableElem.querySelector(`[data-id=${id}]`) as HTMLElement;
  if (cellElem == null) {
    return;
  }
  cellElem.focus();
}

function isStartingResize(target: HTMLElement): boolean {
  return target.nodeType === 1 && target.hasAttribute('data-table-resize');
}

function generateHTMLFromJSON(
  editorStateJSON: string,
  cellEditor: LexicalEditor,
): string {
  const editorState = cellEditor.parseEditorState(editorStateJSON);
  let html = cellHTMLCache.get(editorStateJSON);
  if (html === undefined) {
    html = editorState.read(() => $generateHtmlFromNodes(cellEditor, null));
    const textContent = editorState.read(() => $getRoot().getTextContent());
    cellHTMLCache.set(editorStateJSON, html);
    cellTextContentCache.set(editorStateJSON, textContent);
  }
  return html;
}

function getCurrentDocument(editor: LexicalEditor): Document {
  const rootElement = editor.getRootElement();
  return rootElement !== null ? rootElement.ownerDocument : document;
}

function isCopy(
  keyCode: number,
  shiftKey: boolean,
  metaKey: boolean,
  ctrlKey: boolean,
): boolean {
  if (shiftKey) {
    return false;
  }
  if (keyCode === 67) {
    return IS_APPLE ? metaKey : ctrlKey;
  }

  return false;
}

function isCut(
  keyCode: number,
  shiftKey: boolean,
  metaKey: boolean,
  ctrlKey: boolean,
): boolean {
  if (shiftKey) {
    return false;
  }
  if (keyCode === 88) {
    return IS_APPLE ? metaKey : ctrlKey;
  }

  return false;
}

function isPaste(
  keyCode: number,
  shiftKey: boolean,
  metaKey: boolean,
  ctrlKey: boolean,
): boolean {
  if (shiftKey) {
    return false;
  }
  if (keyCode === 86) {
    return IS_APPLE ? metaKey : ctrlKey;
  }

  return false;
}

function getCellID(domElement: HTMLElement): null | string {
  let node: null | HTMLElement = domElement;
  while (node !== null) {
    const possibleID = node.getAttribute('data-id');
    if (possibleID != null) {
      return possibleID;
    }
    node = node.parentElement;
  }
  return null;
}

function getTableCellWidth(domElement: HTMLElement): number {
  let node: null | HTMLElement = domElement;
  while (node !== null) {
    if (node.nodeName === 'TH' || node.nodeName === 'TD') {
      return node.getBoundingClientRect().width;
    }
    node = node.parentElement;
  }
  return 0;
}

function $updateCells(
  rows: Rows,
  ids: Array<string>,
  cellCoordMap: Map<string, [number, number]>,
  cellEditor: null | LexicalEditor,
  updateTableNode: (fn2: (tableNode: TableNode) => void) => void,
  fn: () => void,
): void {
  for (const id of ids) {
    const cell = getCell(rows, id, cellCoordMap);
    if (cell !== null && cellEditor !== null) {
      const editorState = cellEditor.parseEditorState(cell.json);
      cellEditor._headless = true;
      cellEditor.setEditorState(editorState);
      cellEditor.update(fn, { discrete: true });
      cellEditor._headless = false;
      const newJSON = JSON.stringify(cellEditor.getEditorState());
      updateTableNode((tableNode) => {
        const [x, y] = cellCoordMap.get(id) as [number, number];
        $addUpdateTag('history-push');
        tableNode.updateCellJSON(x, y, newJSON);
      });
    }
  }
}

function isTargetOnPossibleUIControl(target: HTMLElement): boolean {
  let node: HTMLElement | null = target;
  while (node !== null) {
    const { nodeName } = node;
    if (
      nodeName === 'BUTTON'
      || nodeName === 'INPUT'
      || nodeName === 'TEXTAREA'
    ) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

function getSelectedRect(
  startID: string,
  endID: string,
  cellCoordMap: Map<string, [number, number]>,
): null | {startX: number; endX: number; startY: number; endY: number} {
  const startCoords = cellCoordMap.get(startID);
  const endCoords = cellCoordMap.get(endID);
  if (startCoords === undefined || endCoords === undefined) {
    return null;
  }
  const startX = Math.min(startCoords[0], endCoords[0]);
  const endX = Math.max(startCoords[0], endCoords[0]);
  const startY = Math.min(startCoords[1], endCoords[1]);
  const endY = Math.max(startCoords[1], endCoords[1]);

  return {
    endX,
    endY,
    startX,
    startY,
  };
}

function getSelectedIDs(
  rows: Rows,
  startID: string,
  endID: string,
  cellCoordMap: Map<string, [number, number]>,
): Array<string> {
  const rect = getSelectedRect(startID, endID, cellCoordMap);
  if (rect === null) {
    return [];
  }
  const { startX, endY, endX, startY } = rect;
  const ids = [];

  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      ids.push(rows[y].cells[x].id);
    }
  }
  return ids;
}

function extractCellsFromRows(
  rows: Rows,
  rect: {startX: number; endX: number; startY: number; endY: number},
): Rows {
  const { startX, endY, endX, startY } = rect;
  const newRows: Rows = [];

  for (let y = startY; y <= endY; y++) {
    const row = rows[y];
    const newRow = createRow();
    for (let x = startX; x <= endX; x++) {
      const cellClone = { ...row.cells[x] };
      cellClone.id = createUID();
      newRow.cells.push(cellClone);
    }
    newRows.push(newRow);
  }
  return newRows;
}

function TableCellEditor({ cellEditor }: {cellEditor: LexicalEditor}) {
  const { cellEditorConfig, cellEditorPlugins } = useContext(CellContext);

  if (cellEditorPlugins === null || cellEditorConfig === null) {
    return null;
  }

  return (
    <LexicalNestedComposer
      initialEditor={cellEditor}
      initialTheme={cellEditorConfig.theme}
      initialNodes={cellEditorConfig.nodes}
    >
      {cellEditorPlugins}
    </LexicalNestedComposer>
  );
}

function getCell(
  rows: Rows,
  cellID: string,
  cellCoordMap: Map<string, [number, number]>,
): null | Cell {
  const coords = cellCoordMap.get(cellID);
  if (coords === undefined) {
    return null;
  }
  const [x, y] = coords;
  const row = rows[y];
  return row.cells[x];
}

function TableActionMenu({
  cell,
  rows,
  cellCoordMap,
  menuElem,
  updateCellsByID,
  onClose,
  updateTableNode,
  setSortingOptions,
  sortingOptions,
}: {
  cell: Cell;
  menuElem: HTMLElement;
  updateCellsByID: (ids: Array<string>, fn: () => void) => void;
  onClose: () => void;
  updateTableNode: (fn2: (tableNode: TableNode) => void) => void;
  cellCoordMap: Map<string, [number, number]>;
  rows: Rows;
  setSortingOptions: (options: null | SortOptions) => void;
  sortingOptions: null | SortOptions;
}) {
  const dropDownRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const dropdownElem = dropDownRef.current;
    if (dropdownElem !== null) {
      const rect = menuElem.getBoundingClientRect();
      dropdownElem.style.top = `${rect.y}px`;
      dropdownElem.style.left = `${rect.x}px`;
    }
  }, [menuElem]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdownElem = dropDownRef.current;
      if (
        dropdownElem !== null
        && !dropdownElem.contains(event.target as Node)
      ) {
        event.stopPropagation();
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [onClose]);
  const coords = cellCoordMap.get(cell.id);

  if (coords === undefined) {
    return null;
  }
  const [x, y] = coords;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="dropdown"
      ref={dropDownRef}
      onPointerMove={(e) => {
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateTableNode((tableNode) => {
            $addUpdateTag('history-push');
            tableNode.updateCellType(
              x,
              y,
              cell.type === 'normal' ? 'header' : 'normal',
            );
          });
          onClose();
        }}
      >
        <span className="text">
          {cell.type === 'normal' ? 'Make header' : 'Remove header'}
        </span>
      </button>
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateCellsByID([cell.id], () => {
            const root = $getRoot();
            root.clear();
            root.append($createParagraphNode());
          });
          onClose();
        }}
      >
        <span className="text">Clear cell</span>
      </button>
      <hr />
      {cell.type === 'header' && y === 0 && (
        <React.Fragment>
          {sortingOptions !== null && sortingOptions.x === x && (
            <button
              className="item"
              onClick={(event) => {
                event.preventDefault();
                setSortingOptions(null);
                onClose();
              }}
            >
              <span className="text">Remove sorting</span>
            </button>
          )}
          {(sortingOptions === null
            || sortingOptions.x !== x
            || sortingOptions.type === 'descending') && (
            <button
              className="item"
              onClick={(event) => {
                event.preventDefault();
                setSortingOptions({ type: 'ascending', x });
                onClose();
              }}
            >
              <span className="text">Sort ascending</span>
            </button>
          )}
          {(sortingOptions === null
            || sortingOptions.x !== x
            || sortingOptions.type === 'ascending') && (
            <button
              className="item"
              onClick={(event) => {
                event.preventDefault();
                setSortingOptions({ type: 'descending', x });
                onClose();
              }}
            >
              <span className="text">Sort descending</span>
            </button>
          )}
          <hr />
        </React.Fragment>
      )}
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateTableNode((tableNode) => {
            $addUpdateTag('history-push');
            tableNode.insertRowAt(y);
          });
          onClose();
        }}
      >
        <span className="text">Insert row above</span>
      </button>
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateTableNode((tableNode) => {
            $addUpdateTag('history-push');
            tableNode.insertRowAt(y + 1);
          });
          onClose();
        }}
      >
        <span className="text">Insert row below</span>
      </button>
      <hr />
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateTableNode((tableNode) => {
            $addUpdateTag('history-push');
            tableNode.insertColumnAt(x);
          });
          onClose();
        }}
      >
        <span className="text">Insert column left</span>
      </button>
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateTableNode((tableNode) => {
            $addUpdateTag('history-push');
            tableNode.insertColumnAt(x + 1);
          });
          onClose();
        }}
      >
        <span className="text">Insert column right</span>
      </button>
      <hr />
      {rows[0].cells.length !== 1 && (
        <button
          className="item"
          onClick={(event) => {
            event.preventDefault();
            updateTableNode((tableNode) => {
              $addUpdateTag('history-push');
              tableNode.deleteColumnAt(x);
            });
            onClose();
          }}
        >
          <span className="text">Delete column</span>
        </button>
      )}
      {rows.length !== 1 && (
        <button
          className="item"
          onClick={(event) => {
            event.preventDefault();
            updateTableNode((tableNode) => {
              $addUpdateTag('history-push');
              tableNode.deleteRowAt(y);
            });
            onClose();
          }}
        >
          <span className="text">Delete row</span>
        </button>
      )}
      <button
        className="item"
        onClick={(event) => {
          event.preventDefault();
          updateTableNode((tableNode) => {
            $addUpdateTag('history-push');
            tableNode.selectNext();
            tableNode.remove();
          });
          onClose();
        }}
      >
        <span className="text">Delete table</span>
      </button>
    </div>
  );
}

function TableCell({
  cell,
  cellCoordMap,
  cellEditor,
  isEditing,
  isSelected,
  isPrimarySelected,
  theme,
  updateCellsByID,
  updateTableNode,
  rows,
  setSortingOptions,
  sortingOptions,
}: {
  cell: Cell;
  isEditing: boolean;
  isSelected: boolean;
  isPrimarySelected: boolean;
  theme: EditorThemeClasses;
  cellEditor: LexicalEditor;
  updateCellsByID: (ids: Array<string>, fn: () => void) => void;
  updateTableNode: (fn2: (tableNode: TableNode) => void) => void;
  cellCoordMap: Map<string, [number, number]>;
  rows: Rows;
  setSortingOptions: (options: null | SortOptions) => void;
  sortingOptions: null | SortOptions;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRootRef = useRef(null);
  const isHeader = cell.type !== 'normal';
  const editorStateJSON = cell.json;
  const CellComponent = isHeader ? 'th' : 'td';
  const cellWidth = cell.width;
  const menuElem = menuRootRef.current;
  const coords = cellCoordMap.get(cell.id);
  const isSorted = sortingOptions !== null
    && coords !== undefined
    && coords[0] === sortingOptions.x
    && coords[1] === 0;

  useEffect(() => {
    if (isEditing || !isPrimarySelected) {
      setShowMenu(false);
    }
  }, [isEditing, isPrimarySelected]);

  return (
    <CellComponent
      className={`${theme.tableCell} ${isHeader ? theme.tableCellHeader : ''} ${
        isSelected ? theme.tableCellSelected : ''
      }`}
      data-id={cell.id}
      tabIndex={-1}
      style={{ width: cellWidth !== null ? cellWidth : undefined }}
    >
      {isPrimarySelected && (
        <div
          className={`${theme.tableCellPrimarySelected} ${
            isEditing ? theme.tableCellEditing : ''
          }`}
        />
      )}
      {isPrimarySelected && isEditing ? (
        <TableCellEditor cellEditor={cellEditor} />
      ) : (
        <React.Fragment>
          <div
            style={{ position: 'relative', zIndex: 3 }}
            dangerouslySetInnerHTML={{
              __html:
                editorStateJSON === ''
                  ? createEmptyParagraphHTML(theme)
                  : generateHTMLFromJSON(editorStateJSON, cellEditor),
            }}
          />
          <div
            className={theme.tableCellResizer}
            data-table-resize="true"
          />
        </React.Fragment>
      )}
      {isPrimarySelected && !isEditing && (
        <div
          className={theme.tableCellActionButtonContainer}
          ref={menuRootRef}
        >
          <button
            className={theme.tableCellActionButton}
            onClick={(e) => {
              e.preventDefault();
              setShowMenu(!showMenu);
              e.stopPropagation();
            }}
          >
            <i className="chevron-down" />
          </button>
        </div>
      )}
      {showMenu
        && menuElem !== null
        && createPortal(
          <TableActionMenu
            cell={cell}
            menuElem={menuElem}
            updateCellsByID={updateCellsByID}
            onClose={() => setShowMenu(false)}
            updateTableNode={updateTableNode}
            cellCoordMap={cellCoordMap}
            rows={rows}
            setSortingOptions={setSortingOptions}
            sortingOptions={sortingOptions}
          />,
          document.body,
        )}
      {isSorted && <div className={theme.tableCellSortedIndicator} />}
    </CellComponent>
  );
}

export default function TableComponent({
  nodeKey,
  rows: rawRows,
  theme,
}: {
  nodeKey: NodeKey;
  rows: Rows;
  theme: EditorThemeClasses;
}) {
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const resizeMeasureRef = useRef<{size: number; point: number}>({
    point: 0,
    size: 0,
  });
  const [sortingOptions, setSortingOptions] = useState<null | SortOptions>(
    null,
  );
  const addRowsRef = useRef(null);
  const lastCellIDRef = useRef<string | null>(null);
  const tableResizerRulerRef = useRef<null | HTMLDivElement>(null);
  const { cellEditorConfig } = useContext(CellContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddColumns, setShowAddColumns] = useState(false);
  const [showAddRows, setShowAddRows] = useState(false);
  const [editor] = useLexicalComposerContext();
  const mouseDownRef = useRef(false);
  const [resizingID, setResizingID] = useState<null | string>(null);
  const tableRef = useRef<null | HTMLTableElement>(null);
  const cellCoordMap = useMemo(() => {
    const map = new Map();

    for (let y = 0; y < rawRows.length; y++) {
      const row = rawRows[y];
      const { cells } = row;
      for (let x = 0; x < cells.length; x++) {
        const cell = cells[x];
        map.set(cell.id, [x, y]);
      }
    }
    return map;
  }, [rawRows]);
  const rows = useMemo(() => {
    if (sortingOptions === null) {
      return rawRows;
    }
    const _rows = rawRows.slice(1);
    _rows.sort((a, b) => {
      const aCells = a.cells;
      const bCells = b.cells;
      const { x } = sortingOptions;
      const aContent = cellTextContentCache.get(aCells[x].json) || '';
      const bContent = cellTextContentCache.get(bCells[x].json) || '';
      if (aContent === '' || bContent === '') {
        return 1;
      }
      if (sortingOptions.type === 'ascending') {
        return aContent.localeCompare(bContent);
      }
      return bContent.localeCompare(aContent);
    });
    _rows.unshift(rawRows[0]);
    return _rows;
  }, [rawRows, sortingOptions]);
  const [primarySelectedCellID, setPrimarySelectedCellID] = useState<
    null | string
  >(null);
  const cellEditor = useMemo<null | LexicalEditor>(() => {
    if (cellEditorConfig === null) {
      return null;
    }
    const _cellEditor = createEditor({
      namespace: cellEditorConfig.namespace,
      nodes: cellEditorConfig.nodes,
      onError: (error) => cellEditorConfig.onError(error, _cellEditor),
      theme: cellEditorConfig.theme,
    });
    return _cellEditor;
  }, [cellEditorConfig]);
  const [selectedCellIDs, setSelectedCellIDs] = useState<Array<string>>([]);
  const selectedCellSet = useMemo<Set<string>>(
    () => new Set(selectedCellIDs),
    [selectedCellIDs],
  );

  useEffect(() => {
    const tableElem = tableRef.current;
    if (
      isSelected
      && document.activeElement === document.body
      && tableElem !== null
    ) {
      tableElem.focus();
    }
  }, [isSelected]);

  const updateTableNode = useCallback(
    (fn: (tableNode: TableNode) => void) => {
      editor.update(() => {
        const tableNode = $getNodeByKey(nodeKey);
        if ($isTableNode(tableNode)) {
          fn(tableNode);
        }
      });
    },
    [editor, nodeKey],
  );

  const addColumns = () => {
    updateTableNode((tableNode) => {
      $addUpdateTag('history-push');
      tableNode.addColumns(1);
    });
  };

  const addRows = () => {
    updateTableNode((tableNode) => {
      $addUpdateTag('history-push');
      tableNode.addRows(1);
    });
  };

  const modifySelectedCells = useCallback(
    (x: number, y: number, extend: boolean) => {
      const { id } = rows[y].cells[x];
      lastCellIDRef.current = id;
      if (extend) {
        const selectedIDs = getSelectedIDs(
          rows,
          primarySelectedCellID as string,
          id,
          cellCoordMap,
        );
        setSelectedCellIDs(selectedIDs);
      } else {
        setPrimarySelectedCellID(id);
        setSelectedCellIDs(NO_CELLS);
        focusCell(tableRef.current as HTMLElement, id);
      }
    },
    [cellCoordMap, primarySelectedCellID, rows],
  );

  const saveEditorToJSON = useCallback(() => {
    if (cellEditor !== null && primarySelectedCellID !== null) {
      const json = JSON.stringify(cellEditor.getEditorState());
      updateTableNode((tableNode) => {
        const coords = cellCoordMap.get(primarySelectedCellID);
        if (coords === undefined) {
          return;
        }
        $addUpdateTag('history-push');
        const [x, y] = coords;
        tableNode.updateCellJSON(x, y, json);
      });
    }
  }, [cellCoordMap, cellEditor, primarySelectedCellID, updateTableNode]);

  const selectTable = useCallback(() => {
    setTimeout(() => {
      const parentRootElement = editor.getRootElement();
      if (parentRootElement !== null) {
        parentRootElement.focus({ preventScroll: true });
        window.getSelection()?.removeAllRanges();
      }
    }, 20);
  }, [editor]);

  useEffect(() => {
    const tableElem = tableRef.current;
    if (tableElem === null) {
      return;
    }
    const doc = getCurrentDocument(editor);

    const isAtEdgeOfTable = (event: PointerEvent) => {
      const x = event.clientX - tableRect.x;
      const y = event.clientY - tableRect.y;
      return x < 5 || y < 5;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const possibleID = getCellID(event.target as HTMLElement);
      if (
        possibleID !== null
        && editor.isEditable()
        && tableElem.contains(event.target as HTMLElement)
      ) {
        if (isAtEdgeOfTable(event)) {
          setSelected(true);
          setPrimarySelectedCellID(null);
          selectTable();
          return;
        }
        setSelected(false);
        if (isStartingResize(event.target as HTMLElement)) {
          setResizingID(possibleID);
          tableElem.style.userSelect = 'none';
          resizeMeasureRef.current = {
            point: event.clientX,
            size: getTableCellWidth(event.target as HTMLElement),
          };
          return;
        }
        mouseDownRef.current = true;
        if (primarySelectedCellID !== possibleID) {
          if (isEditing) {
            saveEditorToJSON();
          }
          setPrimarySelectedCellID(possibleID);
          setIsEditing(false);
          lastCellIDRef.current = possibleID;
        } else {
          lastCellIDRef.current = null;
        }
        setSelectedCellIDs(NO_CELLS);
      } else if (
        primarySelectedCellID !== null
        && !isTargetOnPossibleUIControl(event.target as HTMLElement)
      ) {
        setSelected(false);
        mouseDownRef.current = false;
        if (isEditing) {
          saveEditorToJSON();
        }
        setPrimarySelectedCellID(null);
        setSelectedCellIDs(NO_CELLS);
        setIsEditing(false);
        lastCellIDRef.current = null;
      }
    };

    const tableRect = tableElem.getBoundingClientRect();

    const handlePointerMove = (event: PointerEvent) => {
      if (resizingID !== null) {
        const tableResizerRulerElem = tableResizerRulerRef.current;
        if (tableResizerRulerElem !== null) {
          const { size, point } = resizeMeasureRef.current;
          const diff = event.clientX - point;
          const newWidth = size + diff;
          let x = event.clientX - tableRect.x;
          if (x < 10) {
            x = 10;
          } else if (x > tableRect.width - 10) {
            x = tableRect.width - 10;
          } else if (newWidth < 20) {
            x = point - size + 20 - tableRect.x;
          }
          tableResizerRulerElem.style.left = `${x}px`;
        }
        return;
      }
      if (!isEditing) {
        const { clientX, clientY } = event;
        const { width, x, y, height } = tableRect;
        const isOnRightEdge = clientX > x + width * 0.9
          && clientX < x + width + 40
          && !mouseDownRef.current;
        setShowAddColumns(isOnRightEdge);
        const isOnBottomEdge = event.target === addRowsRef.current
          || (clientY > y + height * 0.85
            && clientY < y + height + 5
            && !mouseDownRef.current);
        setShowAddRows(isOnBottomEdge);
      }
      if (
        isEditing
        || !mouseDownRef.current
        || primarySelectedCellID === null
      ) {
        return;
      }
      const possibleID = getCellID(event.target as HTMLElement);
      if (possibleID !== null && possibleID !== lastCellIDRef.current) {
        if (selectedCellIDs.length === 0) {
          tableElem.style.userSelect = 'none';
        }
        const selectedIDs = getSelectedIDs(
          rows,
          primarySelectedCellID,
          possibleID,
          cellCoordMap,
        );
        if (selectedIDs.length === 1) {
          setSelectedCellIDs(NO_CELLS);
        } else {
          setSelectedCellIDs(selectedIDs);
        }
        lastCellIDRef.current = possibleID;
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (resizingID !== null) {
        const { size, point } = resizeMeasureRef.current;
        const diff = event.clientX - point;
        let newWidth = size + diff;
        if (newWidth < 10) {
          newWidth = 10;
        }
        updateTableNode((tableNode) => {
          const [x] = cellCoordMap.get(resizingID) as [number, number];
          $addUpdateTag('history-push');
          tableNode.updateColumnWidth(x, newWidth);
        });
        setResizingID(null);
      }
      if (
        tableElem !== null
        && selectedCellIDs.length > 1
        && mouseDownRef.current
      ) {
        tableElem.style.userSelect = 'text';
        window.getSelection()?.removeAllRanges();
      }
      mouseDownRef.current = false;
    };

    doc.addEventListener('pointerdown', handlePointerDown);
    doc.addEventListener('pointermove', handlePointerMove);
    doc.addEventListener('pointerup', handlePointerUp);

    return () => {
      doc.removeEventListener('pointerdown', handlePointerDown);
      doc.removeEventListener('pointermove', handlePointerMove);
      doc.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    cellEditor,
    editor,
    isEditing,
    rows,
    saveEditorToJSON,
    primarySelectedCellID,
    selectedCellSet,
    selectedCellIDs,
    cellCoordMap,
    resizingID,
    updateTableNode,
    setSelected,
    selectTable,
  ]);

  useEffect(() => {
    if (!isEditing && primarySelectedCellID !== null) {
      const doc = getCurrentDocument(editor);

      const loadContentIntoCell = (cell: Cell | null) => {
        if (cell !== null && cellEditor !== null) {
          const editorStateJSON = cell.json;
          const editorState = cellEditor.parseEditorState(editorStateJSON);
          cellEditor.setEditorState(editorState);
        }
      };

      const handleDblClick = (event: MouseEvent) => {
        const possibleID = getCellID(event.target as HTMLElement);
        if (possibleID === primarySelectedCellID && editor.isEditable()) {
          const cell = getCell(rows, possibleID, cellCoordMap);
          loadContentIntoCell(cell);
          setIsEditing(true);
          setSelectedCellIDs(NO_CELLS);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        // Ignore arrow keys, escape or tab
        const { keyCode } = event;
        if (
          keyCode === 16
          || keyCode === 27
          || keyCode === 9
          || keyCode === 37
          || keyCode === 38
          || keyCode === 39
          || keyCode === 40
          || keyCode === 8
          || keyCode === 46
          || !editor.isEditable()
        ) {
          return;
        }
        if (keyCode === 13) {
          event.preventDefault();
        }
        if (
          !isEditing
          && primarySelectedCellID !== null
          && editor.getEditorState().read(() => $getSelection() === null)
          && (event.target as HTMLElement).contentEditable !== 'true'
        ) {
          if (isCopy(keyCode, event.shiftKey, event.metaKey, event.ctrlKey)) {
            editor.dispatchCommand(COPY_COMMAND, event);
            return;
          }
          if (isCut(keyCode, event.shiftKey, event.metaKey, event.ctrlKey)) {
            editor.dispatchCommand(CUT_COMMAND, event);
            return;
          }
          if (isPaste(keyCode, event.shiftKey, event.metaKey, event.ctrlKey)) {
            editor.dispatchCommand(PASTE_COMMAND, event);
            return;
          }
        }
        if (event.metaKey || event.ctrlKey || event.altKey) {
          return;
        }
        const cell = getCell(rows, primarySelectedCellID, cellCoordMap);
        loadContentIntoCell(cell);
        setIsEditing(true);
        setSelectedCellIDs(NO_CELLS);
      };

      doc.addEventListener('dblclick', handleDblClick);
      doc.addEventListener('keydown', handleKeyDown);

      return () => {
        doc.removeEventListener('dblclick', handleDblClick);
        doc.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    cellEditor,
    editor,
    isEditing,
    rows,
    primarySelectedCellID,
    cellCoordMap,
  ]);

  const updateCellsByID = useCallback(
    (ids: Array<string>, fn: () => void) => {
      $updateCells(rows, ids, cellCoordMap, cellEditor, updateTableNode, fn);
    },
    [cellCoordMap, cellEditor, rows, updateTableNode],
  );

  const clearCellsCommand = useCallback((): boolean => {
    if (primarySelectedCellID !== null && !isEditing) {
      updateCellsByID([primarySelectedCellID, ...selectedCellIDs], () => {
        const root = $getRoot();
        root.clear();
        root.append($createParagraphNode());
      });
      return true;
    } if (isSelected) {
      updateTableNode((tableNode) => {
        $addUpdateTag('history-push');
        tableNode.selectNext();
        tableNode.remove();
      });
    }
    return false;
  }, [
    isEditing,
    isSelected,
    primarySelectedCellID,
    selectedCellIDs,
    updateCellsByID,
    updateTableNode,
  ]);

  useEffect(() => {
    const tableElem = tableRef.current;
    if (tableElem === null) {
      return;
    }

    const copyDataToClipboard = (
      event: ClipboardEvent,
      htmlString: string,
      lexicalString: string,
      plainTextString: string,
    ) => {
      const clipboardData = event instanceof KeyboardEvent ? null : event.clipboardData;
      event.preventDefault();

      if (clipboardData != null) {
        clipboardData.setData('text/html', htmlString);
        clipboardData.setData('text/plain', plainTextString);
        clipboardData.setData('application/x-lexical-editor', lexicalString);
      } else {
        const { clipboard } = navigator;
        if (clipboard != null) {
          // Most browsers only support a single item in the clipboard at one time.
          // So we optimize by only putting in HTML.
          const data = [
            new ClipboardItem({
              'text/html': new Blob([htmlString as BlobPart], {
                type: 'text/html',
              }),
            }),
          ];
          clipboard.write(data);
        }
      }
    };

    const getTypeFromObject = async (
      clipboardData: DataTransfer | ClipboardItem,
      type: string,
    ): Promise<string> => {
      try {
        return clipboardData instanceof DataTransfer
          ? clipboardData.getData(type)
          : clipboardData instanceof ClipboardItem
            ? await (await clipboardData.getType(type)).text()
            : '';
      } catch {
        return '';
      }
    };

    const pasteContent = async (event: ClipboardEvent) => {
      let clipboardData: null | DataTransfer | ClipboardItem = (event instanceof InputEvent ? null : event.clipboardData) || null;

      if (primarySelectedCellID !== null && cellEditor !== null) {
        event.preventDefault();

        if (clipboardData === null) {
          try {
            const items = await navigator.clipboard.read();
            clipboardData = items[0];
          } catch {
            // NO-OP
          }
        }
        const lexicalString = clipboardData !== null
          ? await getTypeFromObject(
            clipboardData,
            'application/x-lexical-editor',
          )
          : '';

        if (lexicalString) {
          try {
            const payload = JSON.parse(lexicalString);
            if (
              payload.namespace === editor._config.namespace
              && Array.isArray(payload.nodes)
            ) {
              $updateCells(
                rows,
                [primarySelectedCellID],
                cellCoordMap,
                cellEditor,
                updateTableNode,
                () => {
                  const root = $getRoot();
                  root.clear();
                  root.append($createParagraphNode());
                  root.selectEnd();
                  const nodes = $generateNodesFromSerializedNodes(
                    payload.nodes,
                  );
                  const sel = $getSelection();
                  if ($isRangeSelection(sel)) {
                    $insertGeneratedNodes(cellEditor, nodes, sel);
                  }
                },
              );
              return;
            }
            // eslint-disable-next-line no-empty
          } catch {}
        }
        const htmlString = clipboardData !== null
          ? await getTypeFromObject(clipboardData, 'text/html')
          : '';

        if (htmlString) {
          try {
            const parser = new DOMParser();
            const dom = parser.parseFromString(htmlString, 'text/html');
            const possibleTableElement = dom.querySelector('table');

            if (possibleTableElement != null) {
              const pasteRows = extractRowsFromHTML(possibleTableElement);
              updateTableNode((tableNode) => {
                const [x, y] = cellCoordMap.get(primarySelectedCellID) as [
                  number,
                  number,
                ];
                $addUpdateTag('history-push');
                tableNode.mergeRows(x, y, pasteRows);
              });
              return;
            }
            $updateCells(
              rows,
              [primarySelectedCellID],
              cellCoordMap,
              cellEditor,
              updateTableNode,
              () => {
                const root = $getRoot();
                root.clear();
                root.append($createParagraphNode());
                root.selectEnd();
                const nodes = $generateNodesFromDOM(editor, dom);
                const sel = $getSelection();
                if ($isRangeSelection(sel)) {
                  $insertGeneratedNodes(cellEditor, nodes, sel);
                }
              },
            );
            return;
            // eslint-disable-next-line no-empty
          } catch {}
        }

        // Multi-line plain text in rich text mode pasted as separate paragraphs
        // instead of single paragraph with linebreaks.
        const text = clipboardData !== null
          ? await getTypeFromObject(clipboardData, 'text/plain')
          : '';

        if (text != null) {
          $updateCells(
            rows,
            [primarySelectedCellID],
            cellCoordMap,
            cellEditor,
            updateTableNode,
            () => {
              const root = $getRoot();
              root.clear();
              root.selectEnd();
              const sel = $getSelection();
              if (sel !== null) {
                sel.insertRawText(text);
              }
            },
          );
        }
      }
    };

    const copyPrimaryCell = (event: ClipboardEvent) => {
      if (primarySelectedCellID !== null && cellEditor !== null) {
        const cell = getCell(rows, primarySelectedCellID, cellCoordMap) as Cell;
        const { json } = cell;
        const htmlString = cellHTMLCache.get(json) || null;
        if (htmlString === null) {
          return;
        }
        const editorState = cellEditor.parseEditorState(json);
        const plainTextString = editorState.read(() => $getRoot().getTextContent());
        const lexicalString = editorState.read(() => {
          return JSON.stringify(
            $generateJSONFromSelectedNodes(cellEditor, null),
          );
        });

        copyDataToClipboard(event, htmlString, lexicalString, plainTextString);
      }
    };

    const copyCellRange = (event: ClipboardEvent) => {
      const lastCellID = lastCellIDRef.current;
      if (
        primarySelectedCellID !== null
        && cellEditor !== null
        && lastCellID !== null
      ) {
        const rect = getSelectedRect(
          primarySelectedCellID,
          lastCellID,
          cellCoordMap,
        );
        if (rect === null) {
          return;
        }
        const dom = exportTableCellsToHTML(rows, rect);
        const htmlString = dom.outerHTML;
        const plainTextString = dom.outerText;
        const tableNodeJSON = editor.getEditorState().read(() => {
          const tableNode = $getNodeByKey(nodeKey) as TableNode;
          return tableNode.exportJSON();
        });
        tableNodeJSON.rows = extractCellsFromRows(rows, rect);
        const lexicalJSON = {
          namespace: cellEditor._config.namespace,
          nodes: [tableNodeJSON],
        };
        const lexicalString = JSON.stringify(lexicalJSON);
        copyDataToClipboard(event, htmlString, lexicalString, plainTextString);
      }
    };

    const handlePaste = (
      event: ClipboardEvent,
      activeEditor: LexicalEditor,
    ) => {
      const selection = $getSelection();
      if (
        primarySelectedCellID !== null
        && !isEditing
        && selection === null
        && activeEditor === editor
      ) {
        pasteContent(event);
        mouseDownRef.current = false;
        setSelectedCellIDs(NO_CELLS);
        return true;
      }
      return false;
    };

    const handleCopy = (event: ClipboardEvent, activeEditor: LexicalEditor) => {
      const selection = $getSelection();
      if (
        primarySelectedCellID !== null
        && !isEditing
        && selection === null
        && activeEditor === editor
      ) {
        if (selectedCellIDs.length === 0) {
          copyPrimaryCell(event);
        } else {
          copyCellRange(event);
        }
        return true;
      }
      return false;
    };

    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if ($isNodeSelection(selection)) {
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<ClipboardEvent>(
        PASTE_COMMAND,
        handlePaste,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<ClipboardEvent>(
        COPY_COMMAND,
        handleCopy,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<ClipboardEvent>(
        CUT_COMMAND,
        (event: ClipboardEvent, activeEditor) => {
          if (handleCopy(event, activeEditor)) {
            clearCellsCommand();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_BACKSPACE_COMMAND,
        clearCellsCommand,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_DELETE_COMMAND,
        clearCellsCommand,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<TextFormatType>(
        FORMAT_TEXT_COMMAND,
        (payload) => {
          if (primarySelectedCellID !== null && !isEditing) {
            $updateCells(
              rows,
              [primarySelectedCellID, ...selectedCellIDs],
              cellCoordMap,
              cellEditor,
              updateTableNode,
              () => {
                const sel = $createSelectAll();
                sel.formatText(payload);
              },
            );
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ENTER_COMMAND,
        (event, targetEditor) => {
          const selection = $getSelection();
          if (
            primarySelectedCellID === null
            && !isEditing
            && $isNodeSelection(selection)
            && selection.has(nodeKey)
            && selection.getNodes().length === 1
            && targetEditor === editor
          ) {
            const firstCellID = rows[0].cells[0].id;
            setPrimarySelectedCellID(firstCellID);
            focusCell(tableElem, firstCellID);
            event.preventDefault();
            event.stopPropagation();
            clearSelection();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_TAB_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (
            !isEditing
            && selection === null
            && primarySelectedCellID !== null
          ) {
            const isBackward = event.shiftKey;
            const [x, y] = cellCoordMap.get(primarySelectedCellID) as [
              number,
              number,
            ];
            event.preventDefault();
            let nextX = null;
            let nextY = null;
            if (x === 0 && isBackward) {
              if (y !== 0) {
                nextY = y - 1;
                nextX = rows[nextY].cells.length - 1;
              }
            } else if (x === rows[y].cells.length - 1 && !isBackward) {
              if (y !== rows.length - 1) {
                nextY = y + 1;
                nextX = 0;
              }
            } else if (!isBackward) {
              nextX = x + 1;
              nextY = y;
            } else {
              nextX = x - 1;
              nextY = y;
            }
            if (nextX !== null && nextY !== null) {
              modifySelectedCells(nextX, nextY, false);
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_UP_COMMAND,
        (event, targetEditor) => {
          const selection = $getSelection();
          if (!isEditing && selection === null) {
            const extend = event.shiftKey;
            const cellID = extend
              ? lastCellIDRef.current || primarySelectedCellID
              : primarySelectedCellID;
            if (cellID !== null) {
              const [x, y] = cellCoordMap.get(cellID) as [number, number];
              if (y !== 0) {
                modifySelectedCells(x, y - 1, extend);
                return true;
              }
            }
          }
          if (!$isRangeSelection(selection) || targetEditor !== cellEditor) {
            return false;
          }
          if (
            selection.isCollapsed()
            && selection.anchor
              .getNode()
              .getTopLevelElementOrThrow()
              .getPreviousSibling() === null
          ) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_DOWN_COMMAND,
        (event, targetEditor) => {
          const selection = $getSelection();
          if (!isEditing && selection === null) {
            const extend = event.shiftKey;
            const cellID = extend
              ? lastCellIDRef.current || primarySelectedCellID
              : primarySelectedCellID;
            if (cellID !== null) {
              const [x, y] = cellCoordMap.get(cellID) as [number, number];
              if (y !== rows.length - 1) {
                modifySelectedCells(x, y + 1, extend);
                return true;
              }
            }
          }
          if (!$isRangeSelection(selection) || targetEditor !== cellEditor) {
            return false;
          }
          if (
            selection.isCollapsed()
            && selection.anchor
              .getNode()
              .getTopLevelElementOrThrow()
              .getNextSibling() === null
          ) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_LEFT_COMMAND,
        (event, targetEditor) => {
          const selection = $getSelection();
          if (!isEditing && selection === null) {
            const extend = event.shiftKey;
            const cellID = extend
              ? lastCellIDRef.current || primarySelectedCellID
              : primarySelectedCellID;
            if (cellID !== null) {
              const [x, y] = cellCoordMap.get(cellID) as [number, number];
              if (x !== 0) {
                modifySelectedCells(x - 1, y, extend);
                return true;
              }
            }
          }
          if (!$isRangeSelection(selection) || targetEditor !== cellEditor) {
            return false;
          }
          if (selection.isCollapsed() && selection.anchor.offset === 0) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ARROW_RIGHT_COMMAND,
        (event, targetEditor) => {
          const selection = $getSelection();
          if (!isEditing && selection === null) {
            const extend = event.shiftKey;
            const cellID = extend
              ? lastCellIDRef.current || primarySelectedCellID
              : primarySelectedCellID;
            if (cellID !== null) {
              const [x, y] = cellCoordMap.get(cellID) as [number, number];
              if (x !== rows[y].cells.length - 1) {
                modifySelectedCells(x + 1, y, extend);
                return true;
              }
            }
          }
          if (!$isRangeSelection(selection) || targetEditor !== cellEditor) {
            return false;
          }
          if (selection.isCollapsed()) {
            const { anchor } = selection;
            if (
              (anchor.type === 'text'
                && anchor.offset === anchor.getNode().getTextContentSize())
              || (anchor.type === 'element'
                && anchor.offset === anchor.getNode().getChildrenSize())
            ) {
              event.preventDefault();
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand<KeyboardEvent>(
        KEY_ESCAPE_COMMAND,
        (event, targetEditor) => {
          const selection = $getSelection();
          if (!isEditing && selection === null && targetEditor === editor) {
            setSelected(true);
            setPrimarySelectedCellID(null);
            selectTable();
            return true;
          }
          if (!$isRangeSelection(selection)) {
            return false;
          }
          if (isEditing) {
            saveEditorToJSON();
            setIsEditing(false);
            if (primarySelectedCellID !== null) {
              setTimeout(() => {
                focusCell(tableElem, primarySelectedCellID);
              }, 20);
            }
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [
    cellCoordMap,
    cellEditor,
    clearCellsCommand,
    clearSelection,
    editor,
    isEditing,
    modifySelectedCells,
    nodeKey,
    primarySelectedCellID,
    rows,
    saveEditorToJSON,
    selectTable,
    selectedCellIDs,
    setSelected,
    updateTableNode,
  ]);

  if (cellEditor === null) {
    return;
  }

  return (
    <div style={{ position: 'relative' }}>
      <table
        className={`${theme.table} ${isSelected ? theme.tableSelected : ''}`}
        ref={tableRef}
        tabIndex={-1}
      >
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={theme.tableRow}
            >
              {row.cells.map((cell) => {
                const { id } = cell;
                return (
                  <TableCell
                    key={id}
                    cell={cell}
                    theme={theme}
                    isSelected={selectedCellSet.has(id)}
                    isPrimarySelected={primarySelectedCellID === id}
                    isEditing={isEditing}
                    sortingOptions={sortingOptions}
                    cellEditor={cellEditor}
                    updateCellsByID={updateCellsByID}
                    updateTableNode={updateTableNode}
                    cellCoordMap={cellCoordMap}
                    rows={rows}
                    setSortingOptions={setSortingOptions}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {showAddColumns && (
        <button
          className={theme.tableAddColumns}
          onClick={addColumns}
        />
      )}
      {showAddRows && (
        <button
          className={theme.tableAddRows}
          onClick={addRows}
          ref={addRowsRef}
        />
      )}
      {resizingID !== null && (
        <div
          className={theme.tableResizeRuler}
          ref={tableResizerRulerRef}
        />
      )}
    </div>
  );
}
