'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useListQuery } from '../../providers/ListQuery/index.js';
import { Pagination } from '../Pagination/index.js';
export const RelationshipTablePagination = () => {
  const $ = _c(11);
  const {
    data,
    handlePageChange
  } = useListQuery();
  const t0 = data.nextPage || 2;
  let t1;
  if ($[0] !== handlePageChange) {
    t1 = e => {
      handlePageChange(e);
    };
    $[0] = handlePageChange;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = data.page || 1;
  const t3 = data.prevPage || undefined;
  let t4;
  if ($[2] !== data.hasNextPage || $[3] !== data.hasPrevPage || $[4] !== data.limit || $[5] !== data.totalPages || $[6] !== t0 || $[7] !== t1 || $[8] !== t2 || $[9] !== t3) {
    t4 = _jsx(Pagination, {
      hasNextPage: data.hasNextPage,
      hasPrevPage: data.hasPrevPage,
      limit: data.limit,
      nextPage: t0,
      numberOfNeighbors: 1,
      onChange: t1,
      page: t2,
      prevPage: t3,
      totalPages: data.totalPages
    });
    $[2] = data.hasNextPage;
    $[3] = data.hasPrevPage;
    $[4] = data.limit;
    $[5] = data.totalPages;
    $[6] = t0;
    $[7] = t1;
    $[8] = t2;
    $[9] = t3;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
};
//# sourceMappingURL=Pagination.js.map