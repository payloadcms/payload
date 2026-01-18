'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import { optionsAreObjects } from 'payload/shared';
import React from 'react';
import { useTranslation } from '../../../../../providers/Translation/index.js';
export const SelectCell = t0 => {
  const $ = _c(7);
  const {
    cellData,
    field: t1
  } = t0;
  const {
    options
  } = t1;
  const {
    i18n
  } = useTranslation();
  let t2;
  if ($[0] !== i18n || $[1] !== options) {
    t2 = items => items.map(i => {
      const found = options.filter(f => f.value === i)?.[0]?.label;
      return getTranslation(found, i18n);
    }).join(", ");
    $[0] = i18n;
    $[1] = options;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  const findLabel = t2;
  let t3;
  if ($[3] !== cellData || $[4] !== findLabel || $[5] !== options) {
    let content;
    if (optionsAreObjects(options)) {
      content = Array.isArray(cellData) ? findLabel(cellData) : findLabel([cellData]);
    } else {
      content = Array.isArray(cellData) ? cellData.join(", ") : cellData;
    }
    t3 = _jsx("span", {
      children: content
    });
    $[3] = cellData;
    $[4] = findLabel;
    $[5] = options;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
};
//# sourceMappingURL=index.js.map