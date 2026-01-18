'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { useTranslation } from '../../../../../providers/Translation/index.js';
import './index.scss';
import { stringifyTruncated } from '../../../../../utilities/stringifyTruncated.js';
export const JSONCell = t0 => {
  const $ = _c(4);
  const {
    cellData
  } = t0;
  const {
    t
  } = useTranslation();
  ;
  try {
    let t2;
    if ($[0] !== cellData) {
      const cellDataString = stringifyTruncated(cellData, 100);
      t2 = _jsx("code", {
        className: "json-cell",
        children: _jsx("span", {
          children: cellDataString
        })
      });
      $[0] = cellData;
      $[1] = t2;
    } else {
      t2 = $[1];
    }
    return t2;
  } catch (t1) {
    let t2;
    if ($[2] !== t) {
      t2 = _jsx("code", {
        className: "json-cell",
        children: _jsx("span", {
          children: t("general:error")
        })
      });
      $[2] = t;
      $[3] = t2;
    } else {
      t2 = $[3];
    }
    return t2;
  }
};
//# sourceMappingURL=index.js.map