import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'dots';
export const Dots = ({
  ariaLabel,
  className,
  noBackground,
  orientation = 'vertical'
}) => /*#__PURE__*/_jsxs("div", {
  "aria-label": ariaLabel,
  className: [className, baseClass, noBackground && `${baseClass}--no-background`, orientation && `${baseClass}--${orientation}`].filter(Boolean).join(' '),
  children: [/*#__PURE__*/_jsx("div", {}), /*#__PURE__*/_jsx("div", {}), /*#__PURE__*/_jsx("div", {})]
});
//# sourceMappingURL=index.js.map