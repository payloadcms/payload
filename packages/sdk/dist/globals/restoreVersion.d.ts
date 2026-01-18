import type { GlobalSlug, PayloadTypesShape, TypedLocale, TypeWithVersion } from 'payload';
import type { PayloadSDK } from '../index.js';
import type { DataFromGlobalSlug, PopulateType } from '../types.js';
export type RestoreGlobalVersionByIDOptions<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>> = {
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale<T>;
    /**
     * The ID of the version to restore.
     */
    id: number | string;
    /**
     * Specify [locale](https://payloadcms.com/docs/configuration/localization) for any returned documents.
     */
    locale?: 'all' | TypedLocale<T>;
    /**
     * Specify [populate](https://payloadcms.com/docs/queries/select#populate) to control which fields to include to the result from populated documents.
     */
    populate?: PopulateType<T>;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
};
export declare function restoreGlobalVersion<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>>(sdk: PayloadSDK<T>, options: RestoreGlobalVersionByIDOptions<T, TSlug>, init?: RequestInit): Promise<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>>;
//# sourceMappingURL=restoreVersion.d.ts.map