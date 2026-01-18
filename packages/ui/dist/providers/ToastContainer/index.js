'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Toaster } from 'sonner';
import { Error } from './icons/Error.js';
import { Info } from './icons/Info.js';
import { Success } from './icons/Success.js';
import { Warning } from './icons/Warning.js';
export const ToastContainer = ({
  config
}) => {
  const {
    admin: {
      toast: {
        duration,
        expand,
        limit,
        position
      } = {}
    } = {}
  } = config;
  return /*#__PURE__*/_jsx(Toaster, {
    className: "payload-toast-container",
    closeButton: true,
    // @ts-expect-error
    dir: "undefined",
    duration: duration ?? 4000,
    expand: expand ?? false,
    gap: 8,
    icons: {
      error: /*#__PURE__*/_jsx(Error, {}),
      info: /*#__PURE__*/_jsx(Info, {}),
      success: /*#__PURE__*/_jsx(Success, {}),
      warning: /*#__PURE__*/_jsx(Warning, {})
    },
    offset: "calc(var(--gutter-h) / 2)",
    position: position ?? 'bottom-right',
    toastOptions: {
      classNames: {
        closeButton: 'payload-toast-close-button',
        content: 'toast-content',
        error: 'toast-error',
        icon: 'toast-icon',
        info: 'toast-info',
        success: 'toast-success',
        title: 'toast-title',
        toast: 'payload-toast-item',
        warning: 'toast-warning'
      },
      unstyled: true
    },
    visibleToasts: limit ?? 5
  });
};
//# sourceMappingURL=index.js.map