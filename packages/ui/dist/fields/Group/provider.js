'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use } from 'react';
export const GroupContext = /*#__PURE__*/createContext(false);
export const GroupProvider = ({
  children,
  withinGroup = true
}) => {
  return /*#__PURE__*/_jsx(GroupContext, {
    value: withinGroup,
    children: children
  });
};
export const useGroup = () => use(GroupContext);
//# sourceMappingURL=provider.js.map