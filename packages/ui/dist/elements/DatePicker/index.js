'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React, { lazy, Suspense } from 'react';
import { ShimmerEffect } from '../ShimmerEffect/index.js';
const DatePicker = /*#__PURE__*/lazy(() => import('./DatePicker.js'));
export const DatePickerField = props => /*#__PURE__*/_jsx(Suspense, {
  fallback: /*#__PURE__*/_jsx(ShimmerEffect, {
    height: 50
  }),
  children: /*#__PURE__*/_jsx(DatePicker, {
    ...props
  })
});
//# sourceMappingURL=index.js.map