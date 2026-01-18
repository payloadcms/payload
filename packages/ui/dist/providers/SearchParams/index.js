'use client';

import { jsx as _jsx } from "react/jsx-runtime";
import { useSearchParams as useNextSearchParams } from 'next/navigation.js';
import * as qs from 'qs-esm';
import React, { createContext, use } from 'react';
const initialContext = {
  searchParams: {},
  stringifyParams: () => ''
};
const Context = /*#__PURE__*/createContext(initialContext);
/**
 * @deprecated
 * The SearchParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useSearchParams } from 'next/navigation'
 * ```
 */
export const SearchParamsProvider = ({
  children
}) => {
  const nextSearchParams = useNextSearchParams();
  const searchString = nextSearchParams.toString();
  const searchParams = React.useMemo(() => qs.parse(searchString, {
    depth: 10,
    ignoreQueryPrefix: true
  }), [searchString]);
  const stringifyParams = React.useCallback(({
    params,
    replace = false
  }) => {
    return qs.stringify({
      ...(replace ? {} : searchParams),
      ...params
    }, {
      addQueryPrefix: true
    });
  }, [searchParams]);
  return /*#__PURE__*/_jsx(Context, {
    value: {
      searchParams,
      stringifyParams
    },
    children: children
  });
};
/**
 * @deprecated
 * The `useSearchParams` hook is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useSearchParams } from 'next/navigation'
 * ```
 * If you need to parse the `where` query, you can do so with the `parseSearchParams` utility.
 * ```tsx
 * import { parseSearchParams } from '@payloadcms/ui'
 * const parsedSearchParams = parseSearchParams(searchParams)
 * ```
 */
export const useSearchParams = () => use(Context);
//# sourceMappingURL=index.js.map