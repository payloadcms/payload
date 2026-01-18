import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'upload-field-card';
export function UploadCard({
  children,
  className,
  size = 'medium'
}) {
  return /*#__PURE__*/_jsx("div", {
    className: [baseClass, className, `${baseClass}--size-${size}`].filter(Boolean).join(' '),
    children: children
  });
}
//# sourceMappingURL=index.js.map