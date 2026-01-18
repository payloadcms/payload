'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { CheckboxInput } from '../../fields/Checkbox/Input.js';
import { SelectAllStatus, useSelection } from '../../providers/Selection/index.js';
import { useTranslation } from '../../providers/Translation/index.js';
import './index.scss';
const baseClass = 'select-all';
export const SelectAll = () => {
  const $ = _c(7);
  const {
    selectAll,
    toggleAll
  } = useSelection();
  const {
    i18n
  } = useTranslation();
  let t0;
  if ($[0] !== i18n || $[1] !== selectAll || $[2] !== toggleAll) {
    let t1;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = [baseClass, `${baseClass}__checkbox`];
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    let t2;
    if ($[5] !== toggleAll) {
      t2 = () => toggleAll();
      $[5] = toggleAll;
      $[6] = t2;
    } else {
      t2 = $[6];
    }
    t0 = _jsx(CheckboxInput, {
      "aria-label": selectAll === SelectAllStatus.None ? i18n.t("general:selectAllRows") : i18n.t("general:deselectAllRows"),
      checked: selectAll === SelectAllStatus.AllInPage || selectAll === SelectAllStatus.AllAvailable,
      className: t1.join(" "),
      id: "select-all",
      name: "select-all",
      onToggle: t2,
      partialChecked: selectAll === SelectAllStatus.Some
    });
    $[0] = i18n;
    $[1] = selectAll;
    $[2] = toggleAll;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  return t0;
};
//# sourceMappingURL=index.js.map