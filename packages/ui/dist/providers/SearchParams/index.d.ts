import * as qs from 'qs-esm';
import React from 'react';
export type SearchParamsContext = {
    searchParams: qs.ParsedQs;
    stringifyParams: ({ params, replace }: {
        params: qs.ParsedQs;
        replace?: boolean;
    }) => string;
};
/**
 * @deprecated
 * The SearchParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useSearchParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useSearchParams } from 'next/navigation'
 * ```
 */
export declare const SearchParamsProvider: React.FC<{
    children?: React.ReactNode;
}>;
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
export declare const useSearchParams: () => SearchParamsContext;
//# sourceMappingURL=index.d.ts.map