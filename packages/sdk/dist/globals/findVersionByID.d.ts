import type { ApplyDisableErrors, GlobalSlug, PayloadTypesShape, SelectType, TypedLocale, TypeWithVersion } from 'payload';
import type { PayloadSDK } from '../index.js';
import type { DataFromGlobalSlug, PopulateType } from '../types.js';
export type FindGlobalVersionByIDOptions<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>, TDisableErrors extends boolean> = {
    /**
     * [Control auto-population](https://payloadcms.com/docs/queries/depth) of nested relationship and upload fields.
     */
    depth?: number;
    /**
     * When set to `true`, errors will not be thrown.
     * `null` will be returned instead, if the document on this ID was not found.
     */
    disableErrors?: TDisableErrors;
    draft?: boolean;
    /**
     * Specify a [fallback locale](https://payloadcms.com/docs/configuration/localization) to use for any returned documents.
     */
    fallbackLocale?: false | TypedLocale<T>;
    /**
     * The ID of the version to find.
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
     * Specify [select](https://payloadcms.com/docs/queries/select) to control which fields to include to the result.
     */
    select?: SelectType;
    /**
     * the Global slug to operate against.
     */
    slug: TSlug;
};
export declare function findGlobalVersionByID<T extends PayloadTypesShape, TSlug extends GlobalSlug<T>, TDisableErrors extends boolean>(sdk: PayloadSDK<T>, options: FindGlobalVersionByIDOptions<T, TSlug, TDisableErrors>, init?: RequestInit): Promise<ApplyDisableErrors<TypeWithVersion<DataFromGlobalSlug<T, TSlug>>, TDisableErrors>>;
//# sourceMappingURL=findVersionByID.d.ts.map