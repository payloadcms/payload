import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import './index.scss';
const baseClass = 'no-results';
export function NoListResults({
  Actions,
  Message
}) {
  return /*#__PURE__*/_jsxs("div", {
    className: baseClass,
    children: [Message, Actions && Actions.length > 0 && /*#__PURE__*/_jsx("div", {
      className: `${baseClass}__actions`,
      children: Actions.map((action, index) => /*#__PURE__*/_jsx(React.Fragment, {
        children: action
      }, index))
    })]
  });
}
//# sourceMappingURL=index.js.map