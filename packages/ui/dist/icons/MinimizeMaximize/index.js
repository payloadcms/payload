import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
const baseClass = 'minimize-maximize';
export const MinimizeMaximizeIcon = ({
  className,
  isMinimized
}) => {
  const classes = [baseClass, isMinimized ? `${baseClass}--minimized` : `${baseClass}--maximized`, className].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsx("svg", {
    className: classes,
    height: "20",
    stroke: "currentColor",
    viewBox: "0 0 20 20",
    width: "20",
    xmlns: "http://www.w3.org/2000/svg",
    children: isMinimized ? /*#__PURE__*/_jsx("path", {
      d: "M7.33333 4H5.33333C4.97971 4 4.64057 4.14048 4.39052 4.39052C4.14048 4.64057 4 4.97971 4 5.33333V7.33333M16 7.33333V5.33333C16 4.97971 15.8595 4.64057 15.6095 4.39052C15.3594 4.14048 15.0203 4 14.6667 4H12.6667M4 12.6667V14.6667C4 15.0203 4.14048 15.3594 4.39052 15.6095C4.64057 15.8595 4.97971 16 5.33333 16H7.33333M12.6667 16H14.6667C15.0203 16 15.3594 15.8595 15.6095 15.6095C15.8595 15.3594 16 15.0203 16 14.6667V12.6667"
    }) : /*#__PURE__*/_jsx("path", {
      d: "M7.33333 4V6C7.33333 6.35362 7.19286 6.69276 6.94281 6.94281C6.69276 7.19286 6.35362 7.33333 6 7.33333H4M16 7.33333H14C13.6464 7.33333 13.3072 7.19286 13.0572 6.94281C12.8071 6.69276 12.6667 6.35362 12.6667 6V4M4 12.6667H6C6.35362 12.6667 6.69276 12.8071 6.94281 13.0572C7.19286 13.3072 7.33333 13.6464 7.33333 14V16M12.6667 16V14C12.6667 13.6464 12.8071 13.3072 13.0572 13.0572C13.3072 12.8071 13.6464 12.6667 14 12.6667H16"
    })
  });
};
//# sourceMappingURL=index.js.map