'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { SortDownIcon } from '../../icons/Sort/index.js';
import { useListQuery } from '../../providers/ListQuery/index.js';
import './index.scss';
import { useTranslation } from '../../providers/Translation/index.js';
const baseClass = 'sort-header';
function useSort() {
  const $ = _c(7);
  const {
    handleSortChange,
    orderableFieldName,
    query
  } = useListQuery();
  const querySort = Array.isArray(query.sort) ? query.sort[0] : query.sort;
  const isActive = querySort === orderableFieldName;
  let t0;
  if ($[0] !== handleSortChange || $[1] !== isActive || $[2] !== orderableFieldName) {
    t0 = () => {
      if (isActive) {
        return;
      }
      handleSortChange(orderableFieldName);
    };
    $[0] = handleSortChange;
    $[1] = isActive;
    $[2] = orderableFieldName;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const handleSortPress = t0;
  let t1;
  if ($[4] !== handleSortPress || $[5] !== isActive) {
    t1 = {
      handleSortPress,
      isActive
    };
    $[4] = handleSortPress;
    $[5] = isActive;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  return t1;
}
export const SortHeader = props => {
  const $ = _c(7);
  const {
    appearance
  } = props;
  const {
    handleSortPress,
    isActive
  } = useSort();
  const {
    t
  } = useTranslation();
  const t0 = appearance && `${baseClass}--appearance-${appearance}`;
  let t1;
  if ($[0] !== t0) {
    t1 = [baseClass, t0].filter(Boolean);
    $[0] = t0;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const t2 = t1.join(" ");
  let t3;
  if ($[2] !== handleSortPress || $[3] !== isActive || $[4] !== t || $[5] !== t2) {
    t3 = _jsx("div", {
      className: t2,
      children: _jsx("div", {
        className: `${baseClass}__buttons`,
        children: _jsx("button", {
          "aria-label": t("general:sortByLabelDirection", {
            direction: t("general:ascending"),
            label: "Order"
          }),
          className: `${baseClass}__button ${isActive ? `${baseClass}--active` : ""}`,
          onClick: handleSortPress,
          type: "button",
          children: _jsx(SortDownIcon, {})
        })
      })
    });
    $[2] = handleSortPress;
    $[3] = isActive;
    $[4] = t;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
};
//# sourceMappingURL=index.js.map