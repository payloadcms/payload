'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { transformColumnsToSearchParams } from 'payload/shared';
import React, { startTransition, useCallback, useRef } from 'react';
import { useConfig } from '../../providers/Config/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import { TableColumnContext } from './context.js';
export { useTableColumns } from './context.js';
export const TableColumnsProvider = ({
  children,
  collectionSlug,
  columnState: columnStateFromProps,
  LinkedCellOverride
}) => {
  const {
    getEntityConfig
  } = useConfig();
  const {
    query: currentQuery,
    refineListData
  } = useListQuery();
  const {
    admin: {
      defaultColumns
    } = {}
  } = getEntityConfig({
    collectionSlug
  });
  const [columnState, setOptimisticColumnState] = React.useOptimistic(columnStateFromProps, (state, action) => action);
  const contextRef = useRef({});
  const toggleColumn = useCallback(async column => {
    const newColumnState = (columnState || []).map(col => {
      if (col.accessor === column) {
        return {
          ...col,
          active: !col.active
        };
      }
      return col;
    });
    startTransition(() => {
      setOptimisticColumnState(newColumnState);
    });
    await refineListData({
      columns: transformColumnsToSearchParams(newColumnState)
    });
  }, [refineListData, columnState, setOptimisticColumnState]);
  const moveColumn = useCallback(async args => {
    const {
      fromIndex,
      toIndex
    } = args;
    const newColumnState_0 = [...(columnState || [])];
    const [columnToMove] = newColumnState_0.splice(fromIndex, 1);
    newColumnState_0.splice(toIndex, 0, columnToMove);
    startTransition(() => {
      setOptimisticColumnState(newColumnState_0);
    });
    await refineListData({
      columns: transformColumnsToSearchParams(newColumnState_0)
    });
  }, [columnState, refineListData, setOptimisticColumnState]);
  const setActiveColumns = useCallback(async columns => {
    const newColumnState_1 = currentQuery.columns;
    columns.forEach(colName => {
      const colIndex = newColumnState_1.findIndex(c => colName === c);
      // ensure the name does not begin with a `-` which denotes an inactive column
      if (colIndex !== undefined && newColumnState_1[colIndex][0] === '-') {
        newColumnState_1[colIndex] = colName.slice(1);
      }
    });
    await refineListData({
      columns: newColumnState_1
    });
  }, [currentQuery, refineListData]);
  const resetColumnsState = React.useCallback(async () => {
    await refineListData({
      columns: defaultColumns || []
    });
  }, [defaultColumns, refineListData]);
  return /*#__PURE__*/_jsx(TableColumnContext, {
    value: {
      columns: columnState,
      LinkedCellOverride,
      moveColumn,
      resetColumnsState,
      setActiveColumns,
      toggleColumn,
      ...contextRef.current
    },
    children: children
  });
};
//# sourceMappingURL=index.js.map