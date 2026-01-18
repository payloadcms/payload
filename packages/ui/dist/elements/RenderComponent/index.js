import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const RenderComponent = ({
  Component,
  Fallback,
  props = {}
}) => {
  if (Array.isArray(Component)) {
    return Component.map((c, index) => /*#__PURE__*/_jsx(RenderComponent, {
      Component: c,
      props: props
    }, index));
  }
  if (typeof Component === 'function') {
    return /*#__PURE__*/_jsx(Component, {
      ...props
    });
  }
  return Fallback ? /*#__PURE__*/_jsx(Fallback, {
    ...props
  }) : null;
};
//# sourceMappingURL=index.js.map