'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { lazy, Suspense } from 'react';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
const LazyEditor = /*#__PURE__*/lazy(() => import('./CodeEditor.js'));
export const CodeEditor = props => {
  return /*#__PURE__*/_jsx(Suspense, {
    fallback: /*#__PURE__*/_jsx(ShimmerEffect, {}),
    children: /*#__PURE__*/_jsx(LazyEditor, {
      ...props
    })
  });
};
//# sourceMappingURL=index.js.map