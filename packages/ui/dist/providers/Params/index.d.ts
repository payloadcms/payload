import { useParams as useNextParams } from 'next/navigation.js';
import React from 'react';
export type Params = ReturnType<typeof useNextParams>;
interface IParamsContext extends Params {
}
/**
 * @deprecated
 * The ParamsProvider is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export declare const ParamsProvider: React.FC<{
    children?: React.ReactNode;
}>;
/**
 * @deprecated
 * The `useParams` hook is deprecated and will be removed in the next major release. Instead, use the `useParams` hook from `next/navigation` directly. See https://github.com/payloadcms/payload/pull/9581.
 * @example
 * ```tsx
 * import { useParams } from 'next/navigation'
 * ```
 */
export declare const useParams: () => IParamsContext;
export {};
//# sourceMappingURL=index.d.ts.map