import type { Metadata } from 'next';
import type { AdminViewServerProps, ImportMap, SanitizedConfig } from 'payload';
import React from 'react';
export declare const generateNotFoundViewMetadata: ({ config: configPromise, }: {
    config: Promise<SanitizedConfig> | SanitizedConfig;
    params?: {
        [key: string]: string | string[];
    };
}) => Promise<Metadata>;
export declare const NotFoundPage: ({ config: configPromise, importMap, params: paramsPromise, searchParams: searchParamsPromise, }: {
    config: Promise<SanitizedConfig>;
    importMap: ImportMap;
    params: Promise<{
        segments: string[];
    }>;
    searchParams: Promise<{
        [key: string]: string | string[];
    }>;
}) => Promise<React.JSX.Element>;
export declare function NotFoundView(props: AdminViewServerProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map