'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatFilesize } from 'payload/shared';
import React from 'react';
import { CopyToClipboard } from '../../CopyToClipboard/index.js';
import './index.scss';
const baseClass = 'file-meta';
export const FileMeta = props => {
  const {
    filename,
    filesize,
    height,
    mimeType,
    url: fileURL,
    width
  } = props;
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__url`,
      children: [/*#__PURE__*/_jsx("a", {
        href: fileURL,
        rel: "noopener noreferrer",
        target: "_blank",
        children: filename
      }), /*#__PURE__*/_jsx(CopyToClipboard, {
        defaultMessage: "Copy URL",
        value: fileURL
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__size-type`,
      children: [formatFilesize(filesize), typeof width === 'number' && typeof height === 'number' && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [" - ", width, "x", height]
      }), mimeType && /*#__PURE__*/_jsxs(React.Fragment, {
        children: [" - ", mimeType]
      })]
    })]
  });
};
//# sourceMappingURL=index.js.map