'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isNumber } from 'payload/shared';
import React, { Fragment } from 'react';
import { Pagination } from '../../elements/Pagination/index.js';
import { PerPage } from '../../elements/PerPage/index.js';
import { useListQuery } from '../../providers/ListQuery/context.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'page-controls';
/**
 * @internal
 */
export const PageControlsComponent = t0 => {
  const $ = _c(16);
  const {
    AfterPageControls,
    collectionConfig,
    data,
    handlePageChange,
    handlePerPageChange,
    limit
  } = t0;
  const {
    i18n
  } = useTranslation();
  let t1;
  if ($[0] !== AfterPageControls || $[1] !== collectionConfig?.admin?.pagination?.limits || $[2] !== data.hasNextPage || $[3] !== data.hasPrevPage || $[4] !== data.limit || $[5] !== data.nextPage || $[6] !== data.page || $[7] !== data.pagingCounter || $[8] !== data.prevPage || $[9] !== data.totalDocs || $[10] !== data.totalPages || $[11] !== handlePageChange || $[12] !== handlePerPageChange || $[13] !== i18n || $[14] !== limit) {
    t1 = _jsxs("div", {
      className: baseClass,
      children: [_jsx(Pagination, {
        hasNextPage: data.hasNextPage,
        hasPrevPage: data.hasPrevPage,
        limit: data.limit,
        nextPage: data.nextPage,
        numberOfNeighbors: 1,
        onChange: handlePageChange,
        page: data.page,
        prevPage: data.prevPage,
        totalPages: data.totalPages
      }), data.totalDocs > 0 && _jsxs(Fragment, {
        children: [_jsxs("div", {
          className: `${baseClass}__page-info`,
          children: [data.page * data.limit - (data.limit - 1), "-", data.totalPages > 1 && data.totalPages !== data.page ? data.limit * data.page : data.totalDocs, " ", i18n.t("general:of"), " ", data.totalDocs]
        }), _jsx(PerPage, {
          handleChange: handlePerPageChange,
          limit,
          limits: collectionConfig?.admin?.pagination?.limits,
          resetPage: data.totalDocs <= data.pagingCounter
        }), AfterPageControls]
      })]
    });
    $[0] = AfterPageControls;
    $[1] = collectionConfig?.admin?.pagination?.limits;
    $[2] = data.hasNextPage;
    $[3] = data.hasPrevPage;
    $[4] = data.limit;
    $[5] = data.nextPage;
    $[6] = data.page;
    $[7] = data.pagingCounter;
    $[8] = data.prevPage;
    $[9] = data.totalDocs;
    $[10] = data.totalPages;
    $[11] = handlePageChange;
    $[12] = handlePerPageChange;
    $[13] = i18n;
    $[14] = limit;
    $[15] = t1;
  } else {
    t1 = $[15];
  }
  return t1;
};
/**
 * These page controls are controlled by the global ListQuery state.
 * To override thi behavior, build your own wrapper around PageControlsComponent.
 *
 * @internal
 */
export const PageControls = t0 => {
  const $ = _c(10);
  const {
    AfterPageControls,
    collectionConfig
  } = t0;
  const {
    data,
    defaultLimit: initialLimit,
    handlePageChange,
    handlePerPageChange,
    query
  } = useListQuery();
  let t1;
  if ($[0] !== initialLimit || $[1] !== query.limit) {
    t1 = isNumber(query.limit) ? query.limit : initialLimit;
    $[0] = initialLimit;
    $[1] = query.limit;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  let t2;
  if ($[3] !== AfterPageControls || $[4] !== collectionConfig || $[5] !== data || $[6] !== handlePageChange || $[7] !== handlePerPageChange || $[8] !== t1) {
    t2 = _jsx(PageControlsComponent, {
      AfterPageControls,
      collectionConfig,
      data,
      handlePageChange,
      handlePerPageChange,
      limit: t1
    });
    $[3] = AfterPageControls;
    $[4] = collectionConfig;
    $[5] = data;
    $[6] = handlePageChange;
    $[7] = handlePerPageChange;
    $[8] = t1;
    $[9] = t2;
  } else {
    t2 = $[9];
  }
  return t2;
};
//# sourceMappingURL=index.js.map