import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const baseClass = 'template-minimal';
export const MinimalTemplate = props => {
  const {
    children,
    className,
    style = {},
    width = 'normal'
  } = props;
  const classes = [className, baseClass, `${baseClass}--width-${width}`].filter(Boolean).join(' ');
  return /*#__PURE__*/_jsx("section", {
    className: classes,
    style: style,
    children: /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__wrap`,
      children: children
    })
  });
};
//# sourceMappingURL=index.js.map