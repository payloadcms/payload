import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'drawer-content-container';
export function DrawerContentContainer({
  children,
  className
}) {
  return /*#__PURE__*/_jsx("div", {
    className: [baseClass, className].filter(Boolean).join(' '),
    children: children
  });
}
//# sourceMappingURL=index.js.map