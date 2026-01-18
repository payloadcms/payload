import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const baseClass = 'form-header';
export function FormHeader({
  description,
  heading
}) {
  if (!heading) {
    return null;
  }
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [/*#__PURE__*/_jsx("h1", {
      children: heading
    }), Boolean(description) && /*#__PURE__*/_jsx("p", {
      children: description
    })]
  });
}
//# sourceMappingURL=index.js.map