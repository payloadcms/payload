'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pill, useTranslation } from '@payloadcms/ui';
import React from 'react';
import { VersionPillLabel } from '../../../Version/VersionPillLabel/VersionPillLabel.js';
const baseClass = 'autosave-cell';
export const AutosaveCell = t0 => {
  const $ = _c(5);
  const {
    currentlyPublishedVersion,
    latestDraftVersion,
    rowData
  } = t0;
  const {
    t
  } = useTranslation();
  let t1;
  if ($[0] !== currentlyPublishedVersion || $[1] !== latestDraftVersion || $[2] !== rowData || $[3] !== t) {
    t1 = _jsxs("div", {
      className: `${baseClass}__items`,
      children: [rowData?.autosave && _jsx(Pill, {
        size: "small",
        children: t("version:autosave")
      }), _jsx(VersionPillLabel, {
        currentlyPublishedVersion,
        disableDate: true,
        doc: rowData,
        labelFirst: false,
        labelStyle: "pill",
        latestDraftVersion
      })]
    });
    $[0] = currentlyPublishedVersion;
    $[1] = latestDraftVersion;
    $[2] = rowData;
    $[3] = t;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
};
//# sourceMappingURL=index.js.map