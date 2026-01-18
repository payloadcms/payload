'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { getTranslation } from '@payloadcms/translations';
import React from 'react';
import { useTranslation } from '../../../../../providers/Translation/index.js';
export const ArrayCell = t0 => {
  const $ = _c(2);
  const {
    cellData,
    field: t1
  } = t0;
  const {
    labels
  } = t1;
  const {
    i18n
  } = useTranslation();
  const arrayFields = cellData ?? [];
  const label = arrayFields.length === 1 ? `${arrayFields.length} ${getTranslation(labels?.singular || i18n.t("general:rows"), i18n)}` : `${arrayFields.length} ${getTranslation(labels?.plural || i18n.t("general:rows"), i18n)}`;
  let t2;
  if ($[0] !== label) {
    t2 = _jsx("span", {
      children: label
    });
    $[0] = label;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  return t2;
};
//# sourceMappingURL=index.js.map