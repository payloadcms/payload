import type { SanitizedCollectionConfig } from '../../../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../../../globals/config/types.js';
import type { RequestContext, TypedFallbackLocale } from '../../../index.js';
import type { JsonObject, PayloadRequest, PopulateType, SelectType } from '../../../types/index.js';
export type AfterReadArgs<T extends JsonObject> = {
    collection: null | SanitizedCollectionConfig;
    context: RequestContext;
    currentDepth?: number;
    depth: number;
    doc: T;
    draft: boolean;
    fallbackLocale: TypedFallbackLocale;
    findMany?: boolean;
    /**
     * Controls whether locales should be flattened into the requested locale.
     * E.g.: { [locale]: fields } -> fields
     *
     * @default true
     */
    flattenLocales?: boolean;
    global: null | SanitizedGlobalConfig;
    locale: string;
    overrideAccess: boolean;
    populate?: PopulateType;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields: boolean;
};
/**
 * This function is responsible for the following actions, in order:
 * - Remove hidden fields from response
 * - Flatten locales into requested locale. If the input doc contains all locales, the output doc after this function will only contain the requested locale.
 * - Sanitize outgoing data (point field, etc.)
 * - Execute field hooks
 * - Execute read access control
 * - Populate relationships
 */
export declare function afterRead<T extends JsonObject>(args: AfterReadArgs<T>): Promise<T>;
//# sourceMappingURL=index.d.ts.map