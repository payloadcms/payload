'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'popup-button';
export const PopupTrigger = props => {
  const {
    active,
    button,
    buttonType,
    className,
    disabled,
    noBackground,
    setActive,
    size
  } = props;
  const classes = [baseClass, className, `${baseClass}--${buttonType}`, !noBackground && `${baseClass}--background`, size && `${baseClass}--size-${size}`, disabled && `${baseClass}--disabled`].filter(Boolean).join(' ');
  const handleClick = () => {
    setActive(!active, false);
  };
  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActive(!active, true);
    }
  };
  if (buttonType === 'none') {
    return null;
  }
  if (buttonType === 'custom') {
    return /*#__PURE__*/_jsx("div", {
      className: classes,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      role: "button",
      tabIndex: 0,
      children: button
    });
  }
  return /*#__PURE__*/_jsx("button", {
    className: classes,
    disabled: disabled,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    tabIndex: 0,
    type: "button",
    children: button
  });
};
//# sourceMappingURL=index.js.map