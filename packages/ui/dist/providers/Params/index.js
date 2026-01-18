'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import { useParams as useNextParams } from 'next/navigation.js';
import React, { createContext, use } from 'react';
const Context = /*#__PURE__*/createContext({});
/**
 * @deprecated
 * The ParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export const ParamsProvider = t0 => {
  const $ = _c(3);
  const {
    children
  } = t0;
  const params = useNextParams();
  let t1;
  if ($[0] !== children || $[1] !== params) {
    t1 = _jsx(Context, {
      value: params,
      children
    });
    $[0] = children;
    $[1] = params;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
};
/**
 * @deprecated
 * The `useParams` hook is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export const useParams = () => use(Context);
//# sourceMappingURL=index.js.map