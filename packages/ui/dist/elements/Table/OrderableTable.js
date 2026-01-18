'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.scss';
import { DragOverlay } from '@dnd-kit/core';
import { formatAdminURL } from 'payload/shared';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useConfig } from '../../providers/Config/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import { DraggableSortableItem } from '../DraggableSortable/DraggableSortableItem/index.js';
import { DraggableSortable } from '../DraggableSortable/index.js';
import { OrderableRow } from './OrderableRow.js';
import { OrderableRowDragPreview } from './OrderableRowDragPreview.js';
const baseClass = 'table';
export const OrderableTable = ({
  appearance = 'default',
  BeforeTable,
  collection,
  columns,
  data: initialData
}) => {
  const {
    config
  } = useConfig();
  const {
    data: listQueryData,
    orderableFieldName,
    query
  } = useListQuery();
  // Use the data from ListQueryProvider if available, otherwise use the props
  const serverData = listQueryData?.docs || initialData;
  // Local state to track the current order of rows
  const [localData, setLocalData] = useState(serverData);
  // id -> index for each column
  const [cellMap, setCellMap] = useState({});
  const [dragActiveRowId, setDragActiveRowId] = useState();
  // Update local data when server data changes
  useEffect(() => {
    setLocalData(serverData);
    setCellMap(Object.fromEntries(serverData.map((item, index) => [String(item.id ?? item._id), index])));
  }, [serverData]);
  const activeColumns = columns?.filter(col => col?.active);
  if (!activeColumns || activeColumns.filter(col_0 => !['_dragHandle', '_select'].includes(col_0.accessor)).length === 0) {
    return /*#__PURE__*/_jsx("div", {
      children: "No columns selected"
    });
  }
  const handleDragEnd = async ({
    moveFromIndex,
    moveToIndex
  }) => {
    if (query.sort !== orderableFieldName && query.sort !== `-${orderableFieldName}`) {
      toast.warning('To reorder the rows you must first sort them by the "Order" column');
      setDragActiveRowId(undefined);
      return;
    }
    if (moveFromIndex === moveToIndex) {
      setDragActiveRowId(undefined);
      return;
    }
    const movedId = localData[moveFromIndex].id ?? localData[moveFromIndex]._id;
    const newBeforeRow = moveToIndex > moveFromIndex ? localData[moveToIndex] : localData[moveToIndex - 1];
    const newAfterRow = moveToIndex > moveFromIndex ? localData[moveToIndex + 1] : localData[moveToIndex];
    // Store the original data for rollback
    const previousData = [...localData];
    // Optimisitc update of local state to reorder the rows
    setLocalData(currentData => {
      const newData = [...currentData];
      // Update the rendered cell for the moved row to show "pending"
      newData[moveFromIndex][orderableFieldName] = `pending`;
      // Move the item in the array
      newData.splice(moveToIndex, 0, newData.splice(moveFromIndex, 1)[0]);
      return newData;
    });
    try {
      const target = newBeforeRow ? {
        id: newBeforeRow.id ?? newBeforeRow._id,
        key: newBeforeRow[orderableFieldName]
      } : {
        id: newAfterRow.id ?? newAfterRow._id,
        key: newAfterRow[orderableFieldName]
      };
      const newKeyWillBe = newBeforeRow && query.sort === orderableFieldName || !newBeforeRow && query.sort === `-${orderableFieldName}` ? 'greater' : 'less';
      const jsonBody = {
        collectionSlug: collection.slug,
        docsToMove: [movedId],
        newKeyWillBe,
        orderableFieldName,
        target
      };
      const response = await fetch(formatAdminURL({
        apiRoute: config.routes.api,
        path: '/reorder'
      }), {
        body: JSON.stringify(jsonBody),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });
      if (response.status === 403) {
        throw new Error('You do not have permission to reorder these rows');
      }
      if (!response.ok) {
        throw new Error('Failed to reorder. This can happen if you reorder several rows too quickly. Please try again.');
      }
      if (response.status === 200 && (await response.json())['message'] === 'initial migration') {
        throw new Error('You have enabled "orderable" on a collection with existing documents' + 'and this is the first time you have sorted documents. We have run an automatic migration ' + 'to add an initial order to the documents. Please refresh the page and try again.');
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      // Rollback to previous state if the request fails
      setLocalData(previousData);
      toast.error(error);
    } finally {
      setDragActiveRowId(undefined);
    }
  };
  const handleDragStart = ({
    id
  }) => {
    setDragActiveRowId(id);
  };
  const rowIds = localData.map(row => row.id ?? row._id);
  return /*#__PURE__*/_jsxs("div", {
    className: [baseClass, appearance && `${baseClass}--appearance-${appearance}`].filter(Boolean).join(' '),
    children: [BeforeTable, /*#__PURE__*/_jsxs(DraggableSortable, {
      ids: rowIds,
      onDragEnd: handleDragEnd,
      onDragStart: handleDragStart,
      children: [/*#__PURE__*/_jsxs("table", {
        cellPadding: "0",
        cellSpacing: "0",
        children: [/*#__PURE__*/_jsx("thead", {
          children: /*#__PURE__*/_jsx("tr", {
            children: activeColumns.map((col_1, i) => /*#__PURE__*/_jsx("th", {
              id: `heading-${col_1.accessor}`,
              children: col_1.Heading
            }, i))
          })
        }), /*#__PURE__*/_jsx("tbody", {
          children: localData.map((row_0, rowIndex) => /*#__PURE__*/_jsx(DraggableSortableItem, {
            id: rowIds[rowIndex],
            children: ({
              attributes,
              isDragging,
              listeners,
              setNodeRef,
              transform,
              transition
            }) => /*#__PURE__*/_jsx(OrderableRow, {
              cellMap: cellMap,
              className: `row-${rowIndex + 1}`,
              columns: activeColumns,
              dragAttributes: attributes,
              dragListeners: listeners,
              ref: setNodeRef,
              rowId: row_0.id ?? row_0._id,
              style: {
                opacity: isDragging ? 0 : 1,
                transform,
                transition
              }
            })
          }, rowIds[rowIndex]))
        })]
      }), /*#__PURE__*/_jsx(DragOverlay, {
        children: /*#__PURE__*/_jsx(OrderableRowDragPreview, {
          className: [baseClass, `${baseClass}--drag-preview`].join(' '),
          rowId: dragActiveRowId,
          children: /*#__PURE__*/_jsx(OrderableRow, {
            cellMap: cellMap,
            columns: activeColumns,
            rowId: dragActiveRowId
          })
        })
      })]
    })]
  });
};
//# sourceMappingURL=OrderableTable.js.map