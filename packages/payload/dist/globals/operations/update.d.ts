import type { DeepPartial } from 'ts-essentials';
import type { GlobalSlug } from '../../index.js';
import type { PayloadRequest, PopulateType, SelectType, TransformGlobalWithSelect } from '../../types/index.js';
import type { DataFromGlobalSlug, SanitizedGlobalConfig, SelectFromGlobalSlug } from '../config/types.js';
type Args<TSlug extends GlobalSlug> = {
    autosave?: boolean;
    data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>;
    depth?: number;
    disableTransaction?: boolean;
    draft?: boolean;
    globalConfig: SanitizedGlobalConfig;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    slug: string;
};
export declare const updateOperation: <TSlug extends GlobalSlug, TSelect extends SelectFromGlobalSlug<TSlug>>(args: Args<TSlug>) => Promise<TransformGlobalWithSelect<TSlug, TSelect>>;
export {};
//# sourceMappingURL=update.d.ts.map