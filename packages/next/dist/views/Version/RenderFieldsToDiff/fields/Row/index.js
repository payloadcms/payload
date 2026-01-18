'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { RenderVersionFieldsToDiff } from '../../RenderVersionFieldsToDiff.js';
const baseClass = 'row-diff';
export const Row = ({
  baseVersionField
}) => {
  return /*#__PURE__*/_jsx("div", {
    className: baseClass,
    children: /*#__PURE__*/_jsx(RenderVersionFieldsToDiff, {
      versionFields: baseVersionField.fields
    })
  });
};
//# sourceMappingURL=index.js.map