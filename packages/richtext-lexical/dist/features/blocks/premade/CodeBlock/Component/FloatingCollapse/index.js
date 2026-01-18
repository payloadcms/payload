import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const baseClass = 'code-block-floating-collapse-button';
import { useCollapsible, useTranslation } from '@payloadcms/ui';
import { CollapseIcon } from '../../../../../../lexical/ui/icons/Collapse/index.js';
export const FloatingCollapse = () => {
  const {
    isCollapsed,
    toggle
  } = useCollapsible();
  const {
    t
  } = useTranslation();
  if (!isCollapsed) {
    return null;
  }
  return /*#__PURE__*/_jsxs("button", {
    className: baseClass,
    onClick: toggle,
    type: "button",
    children: [/*#__PURE__*/_jsx("span", {
      children: t('general:collapse')
    }), /*#__PURE__*/_jsx(CollapseIcon, {})]
  });
};
//# sourceMappingURL=index.js.map