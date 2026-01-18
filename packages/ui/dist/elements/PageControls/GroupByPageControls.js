'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React, { useCallback } from 'react';
import { useListQuery } from '../../providers/ListQuery/context.js';
import { PageControlsComponent } from './index.js';
/**
 * If `groupBy` is set in the query, multiple tables will render, one for each group.
 * In this case, each table needs its own `PageControls` to handle pagination.
 * These page controls, however, should not modify the global `ListQuery` state.
 * Instead, they should only handle the pagination for the current group.
 * To do this, build a wrapper around `PageControlsComponent` that handles the pagination logic for the current group.
 */
export const GroupByPageControls = t0 => {
  const $ = _c(12);
  const {
    AfterPageControls,
    collectionConfig,
    data,
    groupByValue
  } = t0;
  const {
    refineListData
  } = useListQuery();
  let t1;
  if ($[0] !== groupByValue || $[1] !== refineListData) {
    t1 = async page => {
      await refineListData({
        queryByGroup: {
          [groupByValue]: {
            page
          }
        }
      });
    };
    $[0] = groupByValue;
    $[1] = refineListData;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const handlePageChange = t1;
  let t2;
  if ($[3] !== groupByValue || $[4] !== refineListData) {
    t2 = async limit => {
      await refineListData({
        queryByGroup: {
          [groupByValue]: {
            limit,
            page: 1
          }
        }
      });
    };
    $[3] = groupByValue;
    $[4] = refineListData;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const handlePerPageChange = t2;
  let t3;
  if ($[6] !== AfterPageControls || $[7] !== collectionConfig || $[8] !== data || $[9] !== handlePageChange || $[10] !== handlePerPageChange) {
    t3 = _jsx(PageControlsComponent, {
      AfterPageControls,
      collectionConfig,
      data,
      handlePageChange,
      handlePerPageChange
    });
    $[6] = AfterPageControls;
    $[7] = collectionConfig;
    $[8] = data;
    $[9] = handlePageChange;
    $[10] = handlePerPageChange;
    $[11] = t3;
  } else {
    t3 = $[11];
  }
  return t3;
};
//# sourceMappingURL=GroupByPageControls.js.map