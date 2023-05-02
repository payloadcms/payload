import { Config as GeneratedTypes } from 'payload/generated-types';
import { DeepPartial } from 'ts-essentials';
import { Collection } from '../config/types';
import { PayloadRequest } from '../../express/types';
export type Arguments<T extends {
    [field: string | number | symbol]: unknown;
}> = {
    collection: Collection;
    req: PayloadRequest;
    id: string | number;
    data: DeepPartial<T>;
    depth?: number;
    disableVerificationEmail?: boolean;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    overwriteExistingFiles?: boolean;
    draft?: boolean;
    autosave?: boolean;
};
declare function updateByID<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>): Promise<GeneratedTypes['collections'][TSlug]>;
export default updateByID;
