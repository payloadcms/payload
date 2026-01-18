'use client';

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Button } from '../Button/index.js';
import './index.scss';
const baseClass = 'card';
export const Card = props => {
  const {
    id,
    actions,
    buttonAriaLabel,
    href,
    onClick,
    title,
    titleAs
  } = props;
  const classes = [baseClass, id, (onClick || href) && `${baseClass}--has-onclick`].filter(Boolean).join(' ');
  const Tag = titleAs ?? 'div';
  return /*#__PURE__*/_jsxs("div", {
    className: classes,
    id: id,
    children: [/*#__PURE__*/_jsx(Tag, {
      className: `${baseClass}__title`,
      children: title
    }), actions && /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__actions`,
      children: actions
    }), (onClick || href) && /*#__PURE__*/_jsx(Button, {
      "aria-label": buttonAriaLabel,
      buttonStyle: "none",
      className: `${baseClass}__click`,
      el: "link",
      onClick: onClick,
      to: href
    })]
  });
};
//# sourceMappingURL=index.js.map