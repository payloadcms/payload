'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Link } from '../../Link/index.js';
import './index.scss';
const baseClass = 'popup-button-list';
export { PopupListDivider as Divider } from '../PopupDivider/index.js';
export { PopupListGroupLabel as GroupLabel } from '../PopupGroupLabel/index.js';
export const ButtonGroup = ({
  buttonSize = 'default',
  children,
  className,
  textAlign = 'left'
}) => {
  const classes = [baseClass, className, `${baseClass}__text-align--${textAlign}`, `${baseClass}__button-size--${buttonSize}`].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsx("div", {
    className: classes,
    children: children
  });
};
export const Button = ({
  id,
  active,
  children,
  className,
  disabled,
  href,
  onClick
}) => {
  const classes = [`${baseClass}__button`, disabled && `${baseClass}__disabled`, active && `${baseClass}__button--selected`, className].filter(Boolean).join(' ');
  if (!disabled) {
    if (href) {
      return /*#__PURE__*/_jsx(Link, {
        className: classes,
        href: href,
        id: id,
        onClick: e => {
          if (onClick) {
            onClick(e);
          }
        },
        prefetch: false,
        children: children
      });
    }
    if (onClick) {
      return /*#__PURE__*/_jsx("button", {
        className: classes,
        id: id,
        onClick: e => {
          if (onClick) {
            onClick(e);
          }
        },
        type: "button",
        children: children
      });
    }
  }
  return /*#__PURE__*/_jsx("div", {
    className: classes,
    id: id,
    children: children
  });
};
//# sourceMappingURL=index.js.map