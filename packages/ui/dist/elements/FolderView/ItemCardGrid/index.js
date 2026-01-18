'use client';

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { ContextFolderFileCard } from '../FolderFileCard/index.js';
import './index.scss';
const baseClass = 'item-card-grid';
export function ItemCardGrid({
  type,
  items,
  subfolderCount,
  title
}) {
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [title && /*#__PURE__*/_jsx("p", {
      className: `${baseClass}__title`,
      children: title
    }), /*#__PURE__*/_jsx("div", {
      className: baseClass,
      children: !items || items?.length === 0 ? null : items.map((item, _index) => {
        const index = _index + (subfolderCount || 0);
        const {
          itemKey
        } = item;
        return /*#__PURE__*/_jsx(ContextFolderFileCard, {
          index: index,
          item: item,
          type: type
        }, itemKey);
      })
    })]
  });
}
//# sourceMappingURL=index.js.map