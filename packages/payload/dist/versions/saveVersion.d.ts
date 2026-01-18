import type { SanitizedCollectionConfig } from '../collections/config/types.js';
import type { SanitizedGlobalConfig } from '../globals/config/types.js';
import type { Payload } from '../index.js';
import type { JsonObject, PayloadRequest, SelectType } from '../types/index.js';
type Args<T extends JsonObject = JsonObject> = {
    autosave?: boolean;
    collection?: SanitizedCollectionConfig;
    docWithLocales: T;
    draft?: boolean;
    global?: SanitizedGlobalConfig;
    id?: number | string;
    operation?: 'create' | 'restoreVersion' | 'update';
    payload: Payload;
    publishSpecificLocale?: string;
    req?: PayloadRequest;
    returning?: boolean;
    select?: SelectType;
    snapshot?: any;
};
export declare function saveVersion<TData extends JsonObject = JsonObject>(args: {
    returning: false;
} & Args<TData>): Promise<null>;
export declare function saveVersion<TData extends JsonObject = JsonObject>(args: {
    returning: true;
} & Args<TData>): Promise<JsonObject>;
export declare function saveVersion<TData extends JsonObject = JsonObject>(args: Omit<Args<TData>, 'returning'>): Promise<JsonObject>;
export {};
//# sourceMappingURL=saveVersion.d.ts.map