'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'simple-table';
export const SimpleTable = ({
  appearance,
  className,
  headerCells: headers,
  tableRows: rows
}) => {
  return /*#__PURE__*/_jsx("div", {
    className: [className, baseClass, appearance && `${baseClass}--appearance-${appearance}`].filter(Boolean).join(' '),
    children: /*#__PURE__*/_jsxs("table", {
      cellPadding: 0,
      cellSpacing: 0,
      className: `${baseClass}__table`,
      children: [/*#__PURE__*/_jsx(TableHead, {
        children: /*#__PURE__*/_jsx(TableRow, {
          children: headers
        })
      }), /*#__PURE__*/_jsx(TableBody, {
        children: rows
      })]
    })
  });
};
export const TableHead = ({
  children,
  className,
  ...rest
}) => {
  return /*#__PURE__*/_jsx("thead", {
    className: `${baseClass}__thead ${className || ''}`.trim(),
    ...rest,
    children: children
  });
};
export const TableBody = ({
  children,
  className,
  ...rest
}) => {
  return /*#__PURE__*/_jsx("tbody", {
    className: `${baseClass}__tbody ${className || ''}`.trim(),
    ...rest,
    children: children
  });
};
export const TableRow = ({
  children,
  className,
  ...rest
}) => {
  return /*#__PURE__*/_jsx("tr", {
    className: `${baseClass}__tr ${className || ''}`.trim(),
    ...rest,
    children: children
  });
};
export const TableCell = ({
  children,
  className,
  ...rest
}) => {
  return /*#__PURE__*/_jsx("td", {
    className: `${baseClass}__td ${className || ''}`.trim(),
    ...rest,
    children: children
  });
};
export const TableHeader = ({
  children,
  className,
  ...rest
}) => {
  return /*#__PURE__*/_jsx("th", {
    className: `${baseClass}__th ${className || ''}`.trim(),
    ...rest,
    children: children
  });
};
export const HiddenCell = ({
  children,
  className,
  ...rest
}) => {
  return /*#__PURE__*/_jsx("td", {
    className: `${baseClass}__hidden-cell ${className || ''}`.trim(),
    ...rest,
    children: children
  });
};
//# sourceMappingURL=index.js.map