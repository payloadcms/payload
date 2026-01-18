'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useDocumentInfo } from '@payloadcms/ui';
import React from 'react';
const baseClass = 'pill-version-count';
export const VersionsPill = () => {
  const $ = _c(2);
  const {
    versionCount
  } = useDocumentInfo();
  if (!versionCount) {
    return null;
  }
  let t0;
  if ($[0] !== versionCount) {
    t0 = _jsx("span", {
      className: baseClass,
      children: versionCount
    });
    $[0] = versionCount;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
};
//# sourceMappingURL=index.js.map