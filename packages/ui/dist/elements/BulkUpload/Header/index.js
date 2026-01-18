'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { DrawerCloseButton } from '../DrawerCloseButton/index.js';
import './index.scss';
const baseClass = 'bulk-upload--drawer-header';
export function DrawerHeader({
  onClose,
  title
}) {
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx("h2", {
      title: title,
      children: title
    }), /*#__PURE__*/_jsx(DrawerCloseButton, {
      onClick: onClose
    })]
  });
}
//# sourceMappingURL=index.js.map