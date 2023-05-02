import { Config as GeneratedTypes } from 'payload/generated-types';
import { MarkOptional } from 'ts-essentials';
import { Collection } from '../config/types';
import { PayloadRequest } from '../../express/types';
export type Arguments<T extends {
    [field: string | number | symbol]: unknown;
}> = {
    collection: Collection;
    req: PayloadRequest;
    depth?: number;
    disableVerificationEmail?: boolean;
    overrideAccess?: boolean;
    showHiddenFields?: boolean;
    data: MarkOptional<T, 'id' | 'updatedAt' | 'createdAt' | 'sizes'>;
    overwriteExistingFiles?: boolean;
    draft?: boolean;
    autosave?: boolean;
};
declare function create<TSlug extends keyof GeneratedTypes['collections']>(incomingArgs: Arguments<GeneratedTypes['collections'][TSlug]>): Promise<GeneratedTypes['collections'][TSlug]>;
export default create;
