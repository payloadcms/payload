import type { Metadata } from 'next';
import type { SanitizedConfig } from 'payload';
type Args = {
    config: Promise<SanitizedConfig>;
    params: Promise<{
        [key: string]: string | string[];
    }>;
    searchParams: Promise<{
        [key: string]: string | string[];
    }>;
};
export declare const generatePageMetadata: ({ config: configPromise, params: paramsPromise, }: Args) => Promise<Metadata>;
export {};
//# sourceMappingURL=metadata.d.ts.map