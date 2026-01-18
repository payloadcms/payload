'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, use } from 'react';
export const OperationContext = /*#__PURE__*/createContext('');
export const OperationProvider = ({
  children,
  operation
}) => /*#__PURE__*/_jsx(OperationContext, {
  value: operation,
  children: children
});
export const useOperation = () => use(OperationContext);
//# sourceMappingURL=index.js.map