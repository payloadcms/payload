'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const baseClass = 'paginator__page';
export const Page = ({
  isCurrent,
  isFirstPage = false,
  isLastPage = false,
  page = 1,
  updatePage
}) => {
  const classes = [baseClass, isCurrent && `${baseClass}--is-current`, isFirstPage && `${baseClass}--is-first-page`, isLastPage && `${baseClass}--is-last-page`].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsx("button", {
    className: classes,
    onClick: () => updatePage(page),
    type: "button",
    children: page
  });
};
//# sourceMappingURL=index.js.map