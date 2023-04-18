import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Where } from '../../types';
import { BulkOperationResult, Collection } from '../config/types';
import { PayloadRequest } from '../../express/types';
export type Arguments<T extends {
    [field: string | number | symbol]: unknown;
}> = {
    collection: Collection;
    req: PayloadRequest;
    where: Where;
    data: DeepPartial<T>;
    depth?: number;
    disableVerificationEmail?: boolean;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    overwriteExistingFiles?: boolean;
    draft?: boolean;
};
declare function update<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>): Promise<BulkOperationResult<TSlug>>;
export default update;
