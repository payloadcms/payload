'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { CheckboxInput } from '../../fields/Checkbox/Input.js';
import { useAuth } from '../../providers/Auth/index.js';
import { useSelection } from '../../providers/Selection/index.js';
import { Locked } from '../Locked/index.js';
import './index.scss';
const baseClass = 'select-row';
export const SelectRow = t0 => {
  const $ = _c(13);
  const {
    rowData
  } = t0;
  const {
    user
  } = useAuth();
  const {
    selected,
    setSelection
  } = useSelection();
  let t1;
  if ($[0] !== rowData || $[1] !== user?.id) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const {
        _isLocked,
        _userEditing
      } = rowData || {};
      const documentIsLocked = _isLocked && _userEditing;
      if (documentIsLocked && _userEditing.id !== user?.id) {
        t1 = _jsx(Locked, {
          user: _userEditing
        });
        break bb0;
      }
    }
    $[0] = rowData;
    $[1] = user?.id;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  let t2;
  if ($[3] !== rowData.id || $[4] !== selected) {
    t2 = selected.get(rowData.id);
    $[3] = rowData.id;
    $[4] = selected;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const t3 = Boolean(t2);
  let t4;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    t4 = [baseClass, `${baseClass}__checkbox`];
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  let t5;
  if ($[7] !== rowData.id || $[8] !== setSelection) {
    t5 = () => setSelection(rowData.id);
    $[7] = rowData.id;
    $[8] = setSelection;
    $[9] = t5;
  } else {
    t5 = $[9];
  }
  let t6;
  if ($[10] !== t3 || $[11] !== t5) {
    t6 = _jsx(CheckboxInput, {
      checked: t3,
      className: t4.join(" "),
      onToggle: t5
    });
    $[10] = t3;
    $[11] = t5;
    $[12] = t6;
  } else {
    t6 = $[12];
  }
  return t6;
};
//# sourceMappingURL=index.js.map