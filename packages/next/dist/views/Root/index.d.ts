import type { I18nClient } from '@payloadcms/translations';
import type { Metadata } from 'next';
import type { ImportMap, SanitizedConfig } from 'payload';
import React from 'react';
export type GenerateViewMetadata = (args: {
    config: SanitizedConfig;
    i18n: I18nClient;
    isEditing?: boolean;
    params?: {
        [key: string]: string | string[];
    };
}) => Promise<Metadata>;
export declare const RootPage: ({ config: configPromise, importMap, params: paramsPromise, searchParams: searchParamsPromise, }: {
    readonly config: Promise<SanitizedConfig>;
    readonly importMap: ImportMap;
    readonly params: Promise<{
        segments: string[];
    }>;
    readonly searchParams: Promise<{
        [key: string]: string | string[];
    }>;
}) => Promise<React.JSX.Element>;
//# sourceMappingURL=index.d.ts.map