import type { DeepPartial } from 'ts-essentials';
import type { PayloadRequest, PopulateType, SelectType, TransformCollectionWithSelect } from '../../types/index.js';
import type { Collection, RequiredDataFromCollectionSlug, SelectFromCollectionSlug } from '../config/types.js';
import { type CollectionSlug } from '../../index.js';
export type Arguments<TSlug extends CollectionSlug> = {
    autosave?: boolean;
    collection: Collection;
    data: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>;
    depth?: number;
    disableTransaction?: boolean;
    disableVerificationEmail?: boolean;
    draft?: boolean;
    id: number | string;
    overrideAccess?: boolean;
    overrideLock?: boolean;
    overwriteExistingFiles?: boolean;
    populate?: PopulateType;
    publishSpecificLocale?: string;
    req: PayloadRequest;
    select?: SelectType;
    showHiddenFields?: boolean;
    trash?: boolean;
};
export declare const updateByIDOperation: <TSlug extends CollectionSlug, TSelect extends SelectFromCollectionSlug<TSlug> = SelectType>(incomingArgs: Arguments<TSlug>) => Promise<TransformCollectionWithSelect<TSlug, TSelect>>;
//# sourceMappingURL=updateByID.d.ts.map