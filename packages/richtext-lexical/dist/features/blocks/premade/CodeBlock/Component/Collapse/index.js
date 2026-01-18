import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const baseClass = 'code-block-collapse-button';
import { useCollapsible } from '@payloadcms/ui';
import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js';
export const Collapse = () => {
  const {
    toggle
  } = useCollapsible();
  return /*#__PURE__*/_jsx("button", {
    className: baseClass,
    onClick: toggle,
    type: "button",
    children: /*#__PURE__*/_jsx(CollapseIcon, {})
  });
};
//# sourceMappingURL=index.js.map