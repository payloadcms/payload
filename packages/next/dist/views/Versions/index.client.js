'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LoadingOverlayToggle, Pagination, PerPage, Table, useListQuery, useTranslation } from '@payloadcms/ui';
import { useSearchParams } from 'next/navigation.js';
import React from 'react';
export const VersionsViewClient = props => {
  const $ = _c(13);
  const {
    baseClass,
    columns,
    paginationLimits
  } = props;
  const {
    data,
    handlePageChange,
    handlePerPageChange
  } = useListQuery();
  const searchParams = useSearchParams();
  let t0;
  if ($[0] !== searchParams) {
    t0 = searchParams.get("limit");
    $[0] = searchParams;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const limit = t0;
  const {
    i18n
  } = useTranslation();
  const versionCount = data?.totalDocs || 0;
  const t1 = !data;
  let t2;
  if ($[2] !== baseClass || $[3] !== columns || $[4] !== data || $[5] !== handlePageChange || $[6] !== handlePerPageChange || $[7] !== i18n || $[8] !== limit || $[9] !== paginationLimits || $[10] !== t1 || $[11] !== versionCount) {
    t2 = _jsxs(React.Fragment, {
      children: [_jsx(LoadingOverlayToggle, {
        name: "versions",
        show: t1
      }), versionCount === 0 && _jsx("div", {
        className: `${baseClass}__no-versions`,
        children: i18n.t("version:noFurtherVersionsFound")
      }), versionCount > 0 && _jsxs(React.Fragment, {
        children: [_jsx(Table, {
          columns,
          data: data?.docs
        }), _jsxs("div", {
          className: `${baseClass}__page-controls`,
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
          }), data?.totalDocs > 0 && _jsxs(React.Fragment, {
            children: [_jsxs("div", {
              className: `${baseClass}__page-info`,
              children: [data.page * data.limit - (data.limit - 1), "-", data.totalPages > 1 && data.totalPages !== data.page ? data.limit * data.page : data.totalDocs, " ", i18n.t("general:of"), " ", data.totalDocs]
            }), _jsx(PerPage, {
              handleChange: handlePerPageChange,
              limit: limit ? Number(limit) : 10,
              limits: paginationLimits
            })]
          })]
        })]
      })]
    });
    $[2] = baseClass;
    $[3] = columns;
    $[4] = data;
    $[5] = handlePageChange;
    $[6] = handlePerPageChange;
    $[7] = i18n;
    $[8] = limit;
    $[9] = paginationLimits;
    $[10] = t1;
    $[11] = versionCount;
    $[12] = t2;
  } else {
    t2 = $[12];
  }
  return t2;
};
//# sourceMappingURL=index.client.js.map