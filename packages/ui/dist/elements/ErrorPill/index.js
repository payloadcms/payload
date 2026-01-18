'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'error-pill';
export const ErrorPill = props => {
  const {
    className,
    count,
    i18n,
    withMessage
  } = props;
  const lessThan3Chars = !withMessage && count < 99;
  const classes = [baseClass, lessThan3Chars && `${baseClass}--fixed-width`, className && className].filter(Boolean).join(' ');
  if (count === 0) {
    return null;
  }
  return /*#__PURE__*/_jsx("div", {
    className: classes,
    children: /*#__PURE__*/_jsxs("div", {
      className: `${baseClass}__content`,
      children: [/*#__PURE__*/_jsx("span", {
        className: `${baseClass}__count`,
        children: count
      }), withMessage && ` ${count > 1 ? i18n.t('general:errors') : i18n.t('general:error')}`]
    })
  });
};
//# sourceMappingURL=index.js.map